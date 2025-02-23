// app/game/[id]/play/page.js
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { init } from "@instantdb/react";
import PrepStage from "./stages/PrepStage";
import GameStage from "./stages/GameStage";
import WaitingStage from "./stages/WaitingStage";
import VotingStage from "./stages/VotingStage";
import ResultsStage from "./stages/ResultsStage";

const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";
const db = init({ appId: APP_ID });

export default function PlayPage() {
  const params = useParams();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localTimeLeft, setLocalTimeLeft] = useState(null);

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

  // Update local timer every second and check for stage completion
  useEffect(() => {
    if (!game) return;

    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setLocalTimeLeft(timeLeft);

      // If timer has reached 0, handle stage completion
      if (timeLeft === 0 && game.isTimerRunning) {
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
    }
  }, [game?.currentStage]);

  const handleStageComplete = async () => {
    if (!game) return;

    const nextStage = getNextStage(game.currentStage);
    const nextDuration = getStageDuration(nextStage);

    await db.transact(
      db.tx.games[game.id].update({
        currentStage: nextStage,
        timerStart: Date.now(),
        timeLeft: nextDuration,
        isTimerRunning: true,
        currentRound:
          nextStage === "PREP"
            ? (game.currentRound || 1) + 1
            : game.currentRound || 1,
      })
    );
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
      // Store answer in the database
      const updatedAnswers = [...(game.answers || []), answer];
      await db.transact(db.tx.games[game.id].update({
        answers: updatedAnswers,
        submittedPlayers: [...(game.submittedPlayers || []), "currentPlayerId"] // Store who submitted
      }));
      setHasSubmitted(true);
    }
  };

  const renderStage = () => {
    if (!game) return <div>Loading...</div>;

    const commonProps = {
      currentRound: game.currentRound || 1,
      timeLeft: localTimeLeft ?? game.timeLeft,
      theme: game.theme || "Things a pirate would say",
      prompt: game.prompt || "BBL",
      users: game.players || [],
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
            showNoSubmissionAlert={!hasSubmitted} // Show alert only for players who didn't submit
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
      default:
        return <div>Loading...</div>;
    }
  };

  return <div className="min-h-screen">{renderStage()}</div>;
}
