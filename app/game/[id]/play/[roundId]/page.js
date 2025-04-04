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

  const handleStageComplete = async () => {
    if (!game || isTransitioning) return;

    setIsTransitioning(true);

    try {
      // Log current state for debugging
      console.log("Current game theme:", game.theme);
      console.log("Current custom theme index:", game.currentCustomThemeIndex);
      console.log("Custom themes:", game.customThemes);

      const nextStage = getNextStage(game.currentStage);
      const nextDuration = getStageDuration(nextStage);

      // Check if we're transitioning from RESULTS to PREP (new round)
      if (game.currentStage === "RESULTS") {
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
            // Preserve host ID during normal stage transitions
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
      PREP: "GAME",
      GAME: "VOTING", // Everyone goes to voting when time expires
      VOTING: "RESULTS",
      RESULTS: "PREP",
    };
    return stages[currentStage] || "PREP";
  };

  const getStageDuration = (stageName) => {
    const durations = {
      PREP: 10000, // 5 seconds to prepare
      GAME: 60, // 30 seconds to enter answer
      VOTING: 60, // 15 seconds to vote
      RESULTS: 100000, // 10 seconds to show results
      PREP: 10000, // 5 seconds to prepare
      GAME: 60, // 30 seconds to enter answer
      VOTING: 60, // 15 seconds to vote
      RESULTS: 100000, // 10 seconds to show results
    };
    return durations[stageName] || 30;
  };

  const handleSubmitAnswer = async (answer) => {
    if (!game) return;

    if (answer !== "") {
      // Store in localStorage
      localStorage.setItem(
        `answer_${params.id}_${game.currentRound || 1}`,
        answer
      );
      localStorage.setItem(
        `answer_${params.id}_${game.currentRound || 1}`,
        answer
      );

      // Store answer in the database
      const updatedAnswers = [...(game.answers || []), answer];
      await db.transact(
        db.tx.games[game.id].update({
          answers: updatedAnswers,
          submittedPlayers: [
            ...(game.submittedPlayers || []),
            "currentPlayerId",
          ],
        })
      );
      await db.transact(
        db.tx.games[game.id].update({
          answers: updatedAnswers,
          submittedPlayers: [
            ...(game.submittedPlayers || []),
            "currentPlayerId",
          ],
        })
      );
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
        return <GameStage {...commonProps} handleSubmit={handleSubmitAnswer} />;
      case "VOTING":
        return (
          <VotingStage
            {...commonProps}
            answers={game.answers || []}
            showNoSubmissionAlert={!hasSubmitted}
            handleVote={(vote) => {
              console.log(vote);
              handleStageComplete();
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
