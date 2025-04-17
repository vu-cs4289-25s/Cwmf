"use client";
import { useState, useEffect, useRef } from "react"; // Added useRef
import { useParams, useRouter } from "next/navigation";
import { init } from "@instantdb/react";
import { id as instantID } from "@instantdb/admin";
import PrepStage from "../stages/PrepStage";
import GameStage from "../stages/GameStage";
import WaitingStage from "../stages/WaitingStage";
import VotingStage from "../stages/VotingStage";
import ResultsStage from "../stages/ResultsStage";
import GameOverStage from "../stages/GameOverStage";
import { getAcronym } from "../../../../utils/acronymGenerator";
import { getRandomTheme } from "../../../../utils/themeBank";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({ appId: APP_ID });

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Add ref to track if we're already transitioning (helps with race conditions)
  const isTransitioningRef = useRef(false);

  // Subscribe to game state
  const { data } = db.useQuery({
    games: {
      $: {
        where: { gameCode: params.id },
      },
    },
  });

  const game = data?.games?.[0];

  // Function to calculate current time left based on server data
  const calculateTimeLeft = () => {
    if (!game || !game.isTimerRunning) return game?.timeLeft || 0;

    const now = Date.now();
    const elapsed = Math.floor((now - game.timerStart) / 1000);
    return Math.max(0, game.timeLeft - elapsed);
  };

  // Handle redirects at the start
  useEffect(() => {
    if (data?.games?.length > 0) {
      const game = data.games[0];

      // Only need to do this once - check if this is a new arrival
      if (game.shouldRedirect && game.redirectTo) {
        // Only have one player (ideally the host) clear these flags
        if (localStorage.getItem("host") === "true") {
          try {
            db.transact(
              db.tx.games[game.id].update({
                redirectTo: null,
              })
            );
          } catch (error) {
            console.error("Error clearing redirect:", error);
          }
        }
      }
    }
  }, [data]); // Run when data changes and we have game data

  // Update local timer every second and check for stage completion
  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setLocalTimeLeft(timeLeft);

      // If timer has reached 0, handle stage completion
      if (timeLeft === 0 && game.isTimerRunning && !isTransitioningRef.current) {
        console.log("Timer reached 0, transitioning to next stage");
        isTransitioningRef.current = true;
        setIsTransitioning(true);
        handleStageComplete();
        clearInterval(interval);
      }
    }, 1000);

    // Initial calculation
    setLocalTimeLeft(calculateTimeLeft());

    return () => clearInterval(interval);
  }, [game?.timerStart, game?.timeLeft, game?.isTimerRunning]);

  // Reset submission state when entering game stage
  useEffect(() => {
    if (game?.currentStage === "GAME") {
      setHasSubmitted(false);

      // Also reset isTransitioning when entering a new stage
      setIsTransitioning(false);
      isTransitioningRef.current = false;
    }
  }, [game?.currentStage]);

  // On mount, generate a next round ID if it doesn't exist
  useEffect(() => {
    const generateNextRoundId = async () => {
      if (data?.games?.length > 0) {
        const game = data.games[0];
        // Only generate if we don't already have a nextRoundId
        if (!game.nextRoundId) {
          try {
            const newRoundId = instantID();
            await db.transact(
              db.tx.games[game.id].update({
                nextRoundId: newRoundId,
              })
            );
            console.log("Generated new round ID:", newRoundId);
          } catch (error) {
            console.error("Error generating round ID:", error);
          }
        }
      }
    };

    generateNextRoundId();
  }, [data?.games]);

  // Handle redirects
  useEffect(() => {
    if (data?.games?.length > 0) {
      const game = data.games[0];

      // Handle redirect for all players
      if (game.shouldRedirect && game.redirectTo) {
        console.log("Redirecting to:", game.redirectTo);
        router.push(game.redirectTo);
      }
    }
  }, [data, router]);

  // Improved resetTrackingArrays function with better error handling
  const resetTrackingArrays = async (nextStage) => {
    if (!game) {
      console.log("Cannot reset tracking arrays: game is null");
      return;
    }

    console.log("Resetting tracking arrays for next stage:", nextStage);

    try {
      // Different reset logic based on next stage
      let updateObj = {};

      if (nextStage === "GAME") {
        // Reset submittedPlayers when starting a new game round
        updateObj.submittedPlayers = [];
        console.log("Resetting submittedPlayers for GAME stage");
      }
      else if (nextStage === "VOTING") {
        // For voting stage, we want to keep submittedPlayers
        console.log("Keeping submittedPlayers for VOTING stage");
        // Don't reset anything
      }
      else if (nextStage === "RESULTS") {
        // Reset votedPlayers when starting a results round
        updateObj.votedPlayers = [];
        console.log("Resetting votedPlayers for RESULTS stage");
      }

      // Only update if we have fields to update
      if (Object.keys(updateObj).length > 0) {
        console.log("Updating game with reset arrays:", updateObj);
        await db.transact(
          db.tx.games[game.id].update(updateObj)
        );
        console.log("Successfully reset tracking arrays");
      } else {
        console.log("No arrays need resetting for this stage transition");
      }
    } catch (error) {
      console.error("Error in resetTrackingArrays:", error);
      // Log more details about the error
      if (error.message) console.error("Error message:", error.message);
      if (error.stack) console.error("Error stack:", error.stack);
    }
  };

  // Modified checkAllSubmitted function to prevent race conditions
  const checkAllSubmitted = () => {
    if (!game) return;

    // Prevent transition if already transitioning
    if (isTransitioningRef.current) {
      console.log("Already transitioning, skipping submission check");
      return;
    }

    // Get the total number of players in the game
    const totalPlayers = game.players?.length || 0;

    // Get the number of players who have submitted answers
    const submittedCount = game.submittedPlayers?.length || 0;

    console.log(`Checking submissions: ${submittedCount}/${totalPlayers} players submitted`);

    // If all players have submitted and we're in the GAME stage, move to VOTING
    if (totalPlayers > 0 && submittedCount >= totalPlayers && game.currentStage === "GAME") {
      console.log(`All ${submittedCount}/${totalPlayers} players submitted! Moving to voting stage.`);

      // Set transitioning state immediately to prevent multiple calls
      isTransitioningRef.current = true;
      setIsTransitioning(true);

      // Small delay to ensure we don't get multiple state updates firing at once
      setTimeout(() => {
        handleStageComplete();
      }, 100);
    }
  };

  const checkAllVoted = () => {
    if (!game) return;

    // Skip if we're not in the voting stage or already transitioning
    if (game.currentStage !== "VOTING" || isTransitioningRef.current) {
      return;
    }

    // Get the total number of players in the game
    const allPlayers = game.players || [];
    const totalPlayers = allPlayers.length;

    if (totalPlayers === 0) {
      console.log("No players found, can't check voting status");
      return;
    }

    // Get the players who have voted
    const votedPlayers = game.votedPlayers || [];
    const votedPlayerIds = votedPlayers; // Should be an array of player IDs

    console.log(`Current vote status: ${votedPlayerIds.length}/${totalPlayers} players have voted`);

    // IMPORTANT: Only transition if ALL players have voted
    // This means the votedPlayers array length must equal the total players count
    if (votedPlayerIds.length >= totalPlayers) {
      console.log(`All ${votedPlayerIds.length}/${totalPlayers} players have voted! Moving to results stage.`);

      // Set transitioning state immediately to prevent multiple calls
      isTransitioningRef.current = true;
      setIsTransitioning(true);

      // Small delay to ensure we don't get multiple state updates firing at once
      setTimeout(() => {
        handleStageComplete();
      }, 100);
    } else {
      console.log(`Waiting for more votes: ${votedPlayerIds.length}/${totalPlayers} players have voted`);
    }
  };

  // Add useEffect to check for all submissions
  useEffect(() => {
    // Check if all players have submitted whenever submittedPlayers changes
    if (game && game.currentStage === "GAME") {
      checkAllSubmitted();
    }
  }, [data?.games?.[0]?.submittedPlayers]);

  // Add useEffect to check for all votes
  useEffect(() => {
    // Check if all eligible players have voted whenever votedPlayers changes
    if (game && game.currentStage === "VOTING") {
      checkAllVoted();
    }
  }, [data?.games?.[0]?.votedPlayers]);

  // Updated handleStageComplete with Error Handling
  const handleStageComplete = async () => {
    // Guard clause to prevent duplicate calls
    if (!game) {
      console.log("Cannot complete stage: game is null");
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      return;
    }

    console.log("Starting stage transition from", game.currentStage);

    try {
      const nextStage = getNextStage(game.currentStage);
      const nextDuration = getStageDuration(nextStage);

      console.log("Transitioning to", nextStage, "with duration", nextDuration);

      try {
        // Reset tracking arrays for the next stage
        await resetTrackingArrays(nextStage);
        console.log("Reset tracking arrays for", nextStage);
      } catch (resetError) {
        console.error("Error resetting tracking arrays:", resetError);
        // Continue with the transition even if this fails
      }

      // Check if we're transitioning from RESULTS to PREP (new round)
      if (game.currentStage === "RESULTS") {
        const nextRoundNumber = (game.currentRound || 1) + 1;

        // Check if we've reached the maximum number of rounds
        if (nextRoundNumber > game.maxRounds) {
          // Game is over, show game over screen but don't redirect yet
          console.log("Game over! Max rounds reached.");
          try {
            await db.transact(
              db.tx.games[game.id].update({
                currentStage: "GAME_OVER",
                isTimerRunning: false,
                shouldRedirect: false,
                redirectPath: `/game/${params.id}/lobby`,
                // Make sure hostId is preserved
                hostId: game.hostId || localStorage.getItem("UUID"),
                customThemes: [],
              })
            );
            console.log("Successfully updated game to GAME_OVER stage");
          } catch (error) {
            console.error("Error updating to GAME_OVER:", error);
            throw error;
          }
        } else {
          // Continue to next round - but ONLY if this player is the host
          const isHost = localStorage.getItem("host") === "true";
          const isHostId = localStorage.getItem("UUID") === game.hostId;

          // Check if this client is the host
          if (isHost || isHostId) {
            console.log("Host is starting next round:", nextRoundNumber);

            try {
              const currentNextRoundId = game.nextRoundId;
              if (!currentNextRoundId) {
                throw new Error("No nextRoundId available for game");
              }

              const futureRoundId = instantID();
              // Generate a new acronym for the new round
              const newAcronym = getAcronym("pronounceable");

              let nextRoundTheme = game.theme;
              let nextCustomThemeIndex = (game.currentCustomThemeIndex || 0) + 1;
              let usedStandardThemes = Array.isArray(game.usedStandardThemes)
                ? [...game.usedStandardThemes]
                : [];

              if (!game.useRandomThemes) {
                // Check if we have custom themes available and haven't used them all
                if (
                  Array.isArray(game.customThemes) &&
                  game.customThemes.length > 0 &&
                  nextCustomThemeIndex < game.customThemes.length
                ) {
                  // Get the next custom theme
                  nextRoundTheme = game.customThemes[nextCustomThemeIndex];

                  // Increment for next round
                  nextCustomThemeIndex++;
                } else {
                  // No more custom themes, use a random standard theme
                  const themeObject = getRandomTheme(usedStandardThemes);
                  const usedTheme = themeObject.theme;
                  const usedIndex = themeObject.index;
                  nextRoundTheme = usedTheme;
                  usedStandardThemes.push(usedIndex);
                }
              } else {
                const themeObject = getRandomTheme(usedStandardThemes);
                const usedTheme = themeObject.theme;
                const usedIndex = themeObject.index;
                nextRoundTheme = usedTheme;
                usedStandardThemes.push(usedIndex);
              }

              // Create a complete update object with all fields that need to be updated
              const gameUpdateObject = {
                currentStage: nextStage,
                timerStart: Date.now(),
                timeLeft: nextDuration,
                isTimerRunning: true,
                currentRound: nextRoundNumber,
                answers: [],
                submittedPlayers: [],
                votedPlayers: [], // Reset voted players for the new round
                prompt: newAcronym,
                nextRoundId: futureRoundId,
                shouldRedirect: true,
                redirectTo: `/game/${params.id}/play/${currentNextRoundId}`,
                hostId: game.hostId,
                theme: nextRoundTheme,
                currentRoundTheme: nextRoundTheme,
                currentCustomThemeIndex: nextCustomThemeIndex,
                usedStandardThemes: usedStandardThemes,
              };

              console.log("Creating new round:", currentNextRoundId);

              // Perform all updates in a single transaction
              await db.transact([
                // Create the new round
                db.tx.round[currentNextRoundId].update({
                  id: currentNextRoundId,
                  gameId: game.id,
                  roundNumber: nextRoundNumber,
                  answers: [],
                  submittedPlayers: [],
                  votes: [],
                  theme: nextRoundTheme,
                  prompt: newAcronym,
                }),

                // Link the new round to the game
                db.tx.games[game.id].link({
                  roundData: currentNextRoundId,
                }),

                // Update the game with our complete object
                db.tx.games[game.id].update(gameUpdateObject),
              ]);

              console.log("Successfully created new round and updated game state");
            } catch (error) {
              console.error("ERROR: Failed to update game state for new round:", error);
              throw error;
            }
          } else {
            // Non-host players just wait for the game state to update
            console.log("Waiting for host to create the next round");
          }
        }
      } else {
        // For other stage transitions, just update the game state
        let updateObj = {
          currentStage: nextStage,
          timerStart: Date.now(),
          timeLeft: nextDuration,
          isTimerRunning: true,
          // Preserve host ID during normal stage transitions
          hostId: game.hostId,
        };

        // Reset tracking arrays based on the current stage transition
        if (game.currentStage === "GAME") {
          // Keep submittedPlayers when transitioning from GAME to VOTING
          console.log("Transitioning from GAME to VOTING. Submitted players:", game.submittedPlayers);
        } else if (game.currentStage === "VOTING") {
          // Reset votedPlayers when transitioning from VOTING to RESULTS
          updateObj.votedPlayers = [];
          console.log("Resetting votedPlayers for RESULTS stage");
        }

        console.log("Updating game with:", updateObj);

        try {
          await db.transact(
            db.tx.games[game.id].update(updateObj)
          );
          console.log("Successfully updated game state to", nextStage);
        } catch (transactError) {
          console.error("Error in db.transact:", transactError);
          throw transactError; // Re-throw to be caught by the outer try/catch
        }
      }
    } catch (error) {
      console.error("Error in handleStageComplete:", error);
      // Add detailed error information
      if (error.message) {
        console.error("Error message:", error.message);
      }
      if (error.stack) {
        console.error("Error stack:", error.stack);
      }
    } finally {
      // Reset the transition flags after a delay
      setTimeout(() => {
        isTransitioningRef.current = false;
        setIsTransitioning(false);
      }, 500);
    }
  };

  const getNextStage = (currentStage) => {
    const stages = {
      PREP: "GAME",
      GAME: "VOTING", // Everyone goes to voting when time expires
      VOTING: "RESULTS",
      RESULTS: "PREP",
    };
    return stages[currentStage] || "PREP";
  };

  const getStageDuration = (stageName) => {
    // TO CHANGE THE TIMING OF THE FIRST PREP STAGE, CHANGE THE INITIAL TIME IN THE LOBBY PAGE ON GAME CREATION
    const durations = {
      PREP: 10,
      GAME: 60,
      VOTING: 60,
      RESULTS: 10,
    };
    return durations[stageName] || 30;
  };

  // In your handleSubmitAnswer function in page.js
  const handleSubmitAnswer = async (answer) => {
    if (!game) return;

    if (answer !== "") {
      // Get the current player's ID
      const playerId = localStorage.getItem("UUID");

      // Get the current round information
      const currentRound = game.currentRound || 1;
      const currentRoundId = params.roundId; // This is the current round ID from the URL

      // Store in localStorage
      localStorage.setItem(
        `answer_${params.id}_${currentRound}`,
        answer
      );

      // Mark that this player submitted for this round (for alert handling)
      localStorage.setItem(`didSubmit_${params.id}_${currentRoundId}`, "true");

      // Store the current stage
      localStorage.setItem(`lastStage_${params.id}`, "GAME");

      try {
        // Only add the player to submittedPlayers if they haven't already submitted
        if (!game.submittedPlayers?.includes(playerId)) {
          const updatedSubmittedPlayers = [...(game.submittedPlayers || []), playerId];

          // Store answer in the game database
          const updatedAnswers = [...(game.answers || []), answer];

          console.log("Submitting answer:", {
            playerId,
            answer,
            submittedPlayers: updatedSubmittedPlayers,
            roundId: currentRoundId
          });

          // Update both the game and the round with the answer
          await db.transact([
            // Update the game
            db.tx.games[game.id].update({
              answers: updatedAnswers,
              submittedPlayers: updatedSubmittedPlayers,
            }),

            // Also update the current round with the same answer
            db.tx.round[currentRoundId].update({
              answers: updatedAnswers,
              submittedPlayers: updatedSubmittedPlayers,
            })
          ]);

          setHasSubmitted(true);

          // Check if all players have submitted after this submission
          checkAllSubmitted();
        }
      } catch (error) {
        console.error("Error submitting answer:", error);
      }
    }
  };

  const renderStage = () => {
    if (!game) return <div>Loading...</div>;

    // Get the saved answer from localStorage for the current round
    const savedAnswer =
      typeof window !== "undefined"
        ? localStorage.getItem(`answer_${params.id}_${game.currentRound || 1}`)
        : "";

    // Use currentRoundTheme as the primary source, fallback to theme only if needed
    const currentTheme =
      game.currentRoundTheme || game.theme || "Things a pirate would say";

    const commonProps = {
      currentRound: game.currentRound || 1,
      timeLeft: localTimeLeft ?? game.timeLeft,
      theme: currentTheme,
      prompt: game.prompt || "BBL",
      users: game.players || [],
      submittedAnswer: savedAnswer,
    };

    // Show waiting stage only for players who submitted during game stage
    if (game.currentStage === "GAME" && hasSubmitted) {
      return <WaitingStage {...commonProps} />;
    }

    // Handle other stages
    switch (game.currentStage) {
      case "PREP":
        return <PrepStage {...commonProps} />;
      case "GAME":
        return <GameStage {...commonProps} handleSubmit={handleSubmitAnswer} />;
      case "VOTING":
        return (
          <VotingStage
            {...commonProps}
            answers={game.answers || []}
            showNoSubmissionAlert={!hasSubmitted}
            handleVote={(voteData) => {
              // Only log the vote submission, don't trigger stage change
              console.log("Vote submitted:", voteData);
            }}
          />
        );
      case "RESULTS":
        return (
          <ResultsStage
            {...commonProps}
            answers={game.answers || []}
            onNext={handleStageComplete}
          />
        );
      case "GAME_OVER":
        return (
          <GameOverStage
            {...commonProps}
            redirectPath={game.redirectPath || `/game/${params.id}/lobby`}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return <div className="min-h-screen">{renderStage()}</div>;
}