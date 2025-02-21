// app/game/[id]/play/page.js
"use client";
import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { init } from "@instantdb/react";
import PrepStage from "./stages/PrepStage";
import GameStage from "./stages/GameStage";
import WaitingStage from "./stages/WaitingStage";
import VotingStage from "./stages/VotingStage";
import ResultsStage from "./stages/ResultsStage";

const APP_ID = "7f057877-f350-4ab6-9568-2e4c235c37a2";
const db = init({ appId: APP_ID });

export default function PlayPage() {
  const params = useParams();
  const [answers, setAnswers] = useState([]);
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

  const handleStageComplete = async () => {
    if (!game) return;

    const nextStage = getNextStage(game.currentStage);
    const nextDuration = getStageDuration(nextStage);

    await db.transact(db.tx.games[game.id].update({
      currentStage: nextStage,
      timerStart: Date.now(),
      timeLeft: nextDuration,
      isTimerRunning: true,
      currentRound: nextStage === "PREP" ? (game.currentRound || 1) + 1 : (game.currentRound || 1)
    }));
  };

  const getNextStage = (currentStage) => {
    const stages = {
      "PREP": "GAME",
      "GAME": "WAITING",
      "WAITING": "VOTING",
      "VOTING": "RESULTS",
      "RESULTS": "PREP"
    };
    return stages[currentStage] || "PREP";
  };

  const getStageDuration = (stageName) => {
    const durations = {
      "PREP": 5,
      "GAME": 30,
      "WAITING": 10,
      "VOTING": 45,
      "RESULTS": 5
    };
    return durations[stageName] || 30;
  };

  const handleSubmitAnswer = (answer) => {
    if (answer !== "") {
      // Store answer in the database
      const updatedAnswers = [...(game.answers || []), answer];
      db.transact(db.tx.games[game.id].update({
        answers: updatedAnswers
      }));
      setAnswers(updatedAnswers);
      handleStageComplete();
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

    switch (game.currentStage) {
      case "PREP":
        return <PrepStage {...commonProps} />;
      case "GAME":
        return <GameStage {...commonProps} handleSubmit={handleSubmit} />;
      case "WAITING":
        return <WaitingStage {...commonProps} onProceed={handleStageComplete} />;
      case "VOTING":
        return (
          <VotingStage
            {...commonProps}
            answers={game.answers || []}
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

  const renderSubmissionForm = () => {
    return (
      <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
        <input
          type="text"
          value={playerAnswer}
          onChange={(e) => setPlayerAnswer(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter your answer..."
        />
        <button
          type="submit"
          className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        >
          Submit
        </button>
      </form>
    );
  };

  if (isLoading) {
    return <div>Loading game data...</div>;
  }

  if (error) {
    return <div>Error loading game: {error.message}</div>;
  }

  if (!gameData) {
    return <div>Game not found</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Add game code display */}
      <div className="absolute top-4 right-4 bg-gray-100 rounded-lg px-4 py-2">
        Game Code: <span className="font-bold">{id}</span>
      </div>
      {renderStage()}
      {renderSubmissionForm()}
    </div>
  );
}