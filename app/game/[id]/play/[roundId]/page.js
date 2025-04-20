"use client";
import { useState, useEffect } from "react";
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
  const [allPlayersSubmitted, setAllPlayersSubmitted] = useState(false);
  const [allPlayersVoted, setAllPlayersVoted] = useState(false);

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

  // Add this new effect near the top of your component
  useEffect(() => {
    // When this component mounts, if we have game data, clear the redirect flags
    if (data?.games?.length > 0) {
      const game = data.games[0];

      // Only need to do this once - check if this is a new arrival
      if (game.shouldRedirect && game.redirectTo) {
        // Only have one player (ideally the host) clear these flags
        if (localStorage.getItem("host") === "true") {
          db.transact(
            db.tx.games[game.id].update({
              // shouldRedirect: false,
              redirectTo: null,
            })
          );
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
      if (timeLeft === 0 && game.isTimerRunning && !isTransitioning) {
        handleStageComplete();
        clearInterval(interval);
      }
    }, 1000);

    // Initial calculation
    setLocalTimeLeft(calculateTimeLeft());

    return () => clearInterval(interval);
  }, [game?.timerStart, game?.timeLeft, game?.isTimerRunning, isTransitioning]);

  // Reset submission state when entering game stage
  useEffect(() => {
    if (game?.currentStage === "GAME") {
      setHasSubmitted(false);
    }
  }, [game?.currentStage]);

  // On mount, generate a next round ID if it doesn't exist
  useEffect(() => {
    const generateNextRoundId = async () => {
      if (data?.games?.length > 0) {
        const game = data.games[0];
        // Only generate if we don't already have a nextRoundId
        if (!game.nextRoundId) {
          const newRoundId = instantID();
          await db.transact(
            db.tx.games[game.id].update({
              nextRoundId: newRoundId,
              nextRoundId: newRoundId,
            })
          );
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
        router.push(game.redirectTo);
      }
    }
  }, [data, router]);

  useEffect(() => {
    if (!game) return;

    // Only check for auto-transition in GAME stage
    if (game.currentStage !== "GAME") return;

    // Get total player count (ensure we're accessing the array correctly)
    const totalPlayers = Array.isArray(game.players) ? game.players.length : 0;

    // Get submitted player count
    const submittedPlayers = Array.isArray(game.submittedPlayers) ? game.submittedPlayers.length : 0;

    console.log(`[Round ${game.currentRound || 1}] Checking submissions: ${submittedPlayers}/${totalPlayers} players have submitted`);
    console.log("Submitted player IDs:", game.submittedPlayers);
    console.log("All player IDs:", game.players.map(p => p.id || p.UUID));

    // Check if all players have submitted
    const allSubmitted = totalPlayers > 0 && submittedPlayers >= totalPlayers;
    setAllPlayersSubmitted(allSubmitted);

    // If all players have submitted and we're not already transitioning, trigger transition
    if (allSubmitted && !isTransitioning) {
      console.log(`[Round ${game.currentRound || 1}] All players have submitted, transitioning early...`);

      // Set transitioning flag to prevent multiple timers
      setIsTransitioning(true);

      // Delay transition by 2 seconds
      const transitionTimer = setTimeout(() => {
        handleStageComplete();
        // Reset transitioning flag after completion
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500); // Add a small delay before resetting the flag
      }, 2000);

      return () => clearTimeout(transitionTimer);
    }
  }, [game?.submittedPlayers, game?.players, game?.currentStage, game?.currentRound]);

  useEffect(() => {
    // Only apply to VOTING stage and don't run if already transitioning
    if (!game || game.currentStage !== "VOTING" || isTransitioning) return;

    // Get total player count
    const totalPlayers = Array.isArray(game.players) ? game.players.length : 0;

    // Get voted player count
    const votedPlayers = Array.isArray(game.votedPlayers) ? game.votedPlayers.length : 0;

    console.log(`[Round ${game.currentRound || 1}] Votes: ${votedPlayers}/${totalPlayers} players have voted`);

    // Check if all players have voted
    const allVoted = totalPlayers > 0 && votedPlayers >= totalPlayers;
    setAllPlayersVoted(allVoted); // Use the new state variable

    // If all players have voted and we're not already transitioning, trigger transition
    if (allVoted && !isTransitioning) {
      console.log(`[Round ${game.currentRound || 1}] All players have voted, transitioning early...`);

      // Set transitioning flag to prevent multiple timers
      setIsTransitioning(true);

      // Delay transition by 2 seconds
      const transitionTimer = setTimeout(() => {
        handleStageComplete();
        setTimeout(() => {
          setIsTransitioning(false);
        }, 500);
      }, 2000);

      return () => clearTimeout(transitionTimer);
    }
  }, [game?.votedPlayers, game?.players, game?.currentStage, game?.currentRound]);

  // Reset submission state when entering a new round
  useEffect(() => {
    if (game?.currentStage === "PREP") {
      setHasSubmitted(false);
      setAllPlayersSubmitted(false);
    }
  }, [game?.currentStage, game?.currentRound]);

  useEffect(() => {
    if (game?.currentStage === "GAME") {
      setAllPlayersVoted(false);
    }
  }, [game?.currentStage]);

  const handleStageComplete = async () => {
    if (!game || isTransitioning) return;

    setIsTransitioning(true);

    try {
      const nextStage = getNextStage(game.currentStage);
      const nextDuration = getStageDuration(nextStage);

      if (game.currentStage === "VOTING") {
        await db.transact(
          db.tx.games[game.id].update({
            currentStage: nextStage,
            timerStart: Date.now(),
            timeLeft: nextDuration,
            isTimerRunning: true,
            votedPlayers: [], // Reset voted players
            hostId: game.hostId,
          })
        );
      } else if (game.currentStage === "RESULTS") {
        const nextRoundNumber = (game.currentRound || 1) + 1;

        // Check if we've reached the maximum number of rounds
        if (nextRoundNumber > game.maxRounds) {
          // Game is over, show game over screen but don't redirect yet
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
        } else {
          // Continue to next round
          const currentNextRoundId = game.nextRoundId;
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
            votedPlayers: [],
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

          try {
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
          } catch (error) {
            console.error("ERROR: Failed to update game state:", error);
          }
        }
      } else {
        // For other stage transitions, just update the game state
        await db.transact(
          db.tx.games[game.id].update({
            currentStage: nextStage,
            timerStart: Date.now(),
            timeLeft: nextDuration,
            isTimerRunning: true,
            hostId: game.hostId,
          })
        );
      }
    } catch (error) {
      console.error("Error in handleStageComplete:", error);
    } finally {
      setIsTransitioning(false);
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

  const handleSubmitAnswer = async (answer) => {
    if (!game) return;

    if (answer !== "") {
      // Get the current player's ID
      const playerId = localStorage.getItem("UUID");
      console.log("Current player submitting:", playerId);

      // Store in localStorage
      localStorage.setItem(
        `answer_${params.id}_${game.currentRound || 1}`,
        answer
      );

      // Get current submitted players list
      const currentSubmittedPlayers = Array.isArray(game.submittedPlayers)
        ? [...game.submittedPlayers]
        : [];

      console.log("Current submitted players:", currentSubmittedPlayers);

      // Only add player if they haven't already submitted
      if (!currentSubmittedPlayers.includes(playerId)) {
        // Store answer in the database
        const updatedAnswers = Array.isArray(game.answers)
          ? [...game.answers, answer]
          : [answer];

        try {
          await db.transact(
            db.tx.games[game.id].update({
              answers: updatedAnswers,
              submittedPlayers: [...currentSubmittedPlayers, playerId],
            })
          );
          console.log(`Player ${playerId} submitted answer. New submissions: ${[...currentSubmittedPlayers, playerId]}`);
        } catch (error) {
          console.error("Error updating game with submission:", error);
        }
      }

      setHasSubmitted(true);
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
      allPlayersSubmitted: allPlayersSubmitted, // Pass this new prop
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
            allPlayersVoted={allPlayersVoted} // Use the new state variable
            votedPlayersCount={Array.isArray(game.votedPlayers) ? game.votedPlayers.length : 0}
            totalPlayers={Array.isArray(game.players) ? game.players.length : 0}
            handleVote={(vote) => {
              console.log(vote);
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
