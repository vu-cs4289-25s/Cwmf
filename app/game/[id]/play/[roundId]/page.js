// app/game/[id]/play/page.js
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
              shouldRedirect: false,
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
              nextRoundId: newRoundId
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
      const nextStage = getNextStage(game.currentStage);
      const nextDuration = getStageDuration(nextStage);

      // Check if we're transitioning from RESULTS to PREP (new round)
      if (game.currentStage === "RESULTS") {
        const nextRoundNumber = (game.currentRound || 1) + 1;

        // Check if we've reached the maximum number of rounds
        if (nextRoundNumber > (game.maxRounds || 3)) {
          // Game is over, show game over screen but don't redirect yet
          // The GameOverStage component will handle the redirect after 10 seconds
          // Make sure to preserve the hostId
          await db.transact(
            db.tx.games[game.id].update({
              currentStage: "GAME_OVER",
              isTimerRunning: false,
              shouldRedirect: false,
              redirectPath: `/game/${params.id}/lobby`,
              // Make sure hostId is preserved
              hostId: game.hostId || localStorage.getItem("UUID")
            })
          );
        } else {
          // Continue to next round
          const currentNextRoundId = game.nextRoundId;
          // Generate a new nextRoundId for the future round
          const futureRoundId = instantID();
          // Generate a new acronym for the new round
          const newAcronym = getAcronym('pronounceable');

          // Determine theme for next round based on settings
          let nextRoundTheme = game.theme || "Things a pirate would say";

          if (game.useRandomThemes) {
            // Check if we have custom themes
            if (game.customThemes && game.customThemes.length > 0 && Math.random() > 0.7) {
              // 30% chance to use a custom theme if available
              const randomCustomIndex = Math.floor(Math.random() * game.customThemes.length);
              nextRoundTheme = game.customThemes[randomCustomIndex];
            } else {
              // Otherwise use a theme from the standard theme bank
              nextRoundTheme = getRandomTheme();
            }
          }

          await db.transact([
            // Create the new round
            db.tx.round[currentNextRoundId].update({
              id: currentNextRoundId,
              gameId: game.id,
              roundNumber: nextRoundNumber,
              answers: [],
              submittedPlayers: [],
              votes: [],
              theme: nextRoundTheme, // Use the determined theme
              prompt: newAcronym,
            }),

            // Link the new round to the game
            db.tx.games[game.id].link({
              roundData: currentNextRoundId,
            }),

            // Update game state for the new round and set the future nextRoundId
            db.tx.games[game.id].update({
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
              // Preserve host ID when moving to next round
              hostId: game.hostId,
              // Update the current theme if using random themes
              theme: game.useRandomThemes ? nextRoundTheme : game.theme
            }),
          ]);
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
            hostId: game.hostId
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
      "PREP": "GAME",
      "GAME": "VOTING", // Everyone goes to voting when time expires
      "VOTING": "RESULTS",
      "RESULTS": "PREP"
    };
    return stages[currentStage] || "PREP";
  };

  const getStageDuration = (stageName) => {
    const durations = {
      "PREP": 5,     // 5 seconds to prepare
      "GAME": 30,    // 30 seconds to enter answer
      "VOTING": 15,  // 15 seconds to vote
      "RESULTS": 10  // 10 seconds to show results
    };
    return durations[stageName] || 30;
  };

  const handleSubmitAnswer = async (answer) => {
    if (!game) return;

    if (answer !== "") {
      // Store in localStorage
      localStorage.setItem(`answer_${params.id}_${game.currentRound || 1}`, answer);

      // Store answer in the database
      const updatedAnswers = [...(game.answers || []), answer];
      await db.transact(db.tx.games[game.id].update({
        answers: updatedAnswers,
        submittedPlayers: [...(game.submittedPlayers || []), "currentPlayerId"]
      }));
      setHasSubmitted(true);
    }
  };

  const renderStage = () => {
    if (!game) return <div>Loading...</div>;

    // Get the saved answer from localStorage for the current round
    const savedAnswer = typeof window !== 'undefined' ?
      localStorage.getItem(`answer_${params.id}_${game.currentRound || 1}`) : '';

    const commonProps = {
      currentRound: game.currentRound || 1,
      timeLeft: localTimeLeft ?? game.timeLeft,
      theme: game.theme || "Things a pirate would say",
      prompt: game.prompt || "BBL",
      users: game.players || [],
      submittedAnswer: savedAnswer, // Pass the saved answer to all stages
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
        return <GameStage
          {...commonProps}
          handleSubmit={handleSubmitAnswer}
        />;
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