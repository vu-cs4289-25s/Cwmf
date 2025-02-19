// app/game/[id]/play/page.js
"use client";
import { useState, useEffect, use } from "react";
import { init } from "@instantdb/react";

// Import stages
import PrepStage from "./stages/PrepStage";
import GameStage from "./stages/GameStage";
import WaitingStage from "./stages/WaitingStage";
import VotingStage from "./stages/VotingStage";
import ResultsStage from "./stages/ResultsStage";
import ShowSubmissionsStage from "./stages/ShowSubmissionsStage";

const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";
const db = init({ appId: APP_ID });

// Add this function near your other database functions
async function submitAnswer(gameId, playerId, answer) {
  try {
    const submission = {
      playerId,
      answer,
      timestamp: Date.now(),
    };
    
    await db.transact([{
      games: {
        $gameCode: gameId,
        roundData: {
          submission: submission
        }
      }
    }]);
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting answer:', error);
    return { success: false, error };
  }
}

export default function PlayPage({ params }) {
  const { id } = use(params);
  const [stage, setStage] = useState("PREP");
  const [currentRound, setCurrentRound] = useState(5);
  const [timeLeft, setTimeLeft] = useState(5);
  const [gameData, setGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerAnswer, setPlayerAnswer] = useState('');
  
  // Query game data with actual fields from DB
  
  async function getGameData(gameCode) {
    const query = {
      games: {
        $: {
          where: { gameCode: gameCode },
        },
      },
    };
    const { isLoading, error, data } = await db.queryOnce(query);
    if (isLoading) {
      return { error: "Loading..." };
    }
    return data.games[0];
  }

  // Fetch game data on component mount
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await getGameData(id);
        if (!data) {
          setError(new Error("Game not found"));
        } else {
          setGameData(data);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGame();
  }, [id]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const handleTimeUp = () => {
    switch (stage) {
      case "PREP":
        setStage("GAME");
        setTimeLeft(30);
        break;
      case "WAITING":
        setStage("VOTING");
        setTimeLeft(45);
        break;
      case "VOTING":
        setStage("RESULTS");
        setTimeLeft(5);
        break;
      case "RESULTS":
        handleNextRound();
        break;
    }
  };

  const handleNextRound = () => {
    setCurrentRound((prev) => prev + 1);
    setStage("PREP");
    setTimeLeft(30);
    // Clear roundData for next round
    if (gameData) {
      db.transact([{
        games: {
          $id: gameData.id,
          roundData: [] // Reset roundData for the new round
        }
      }]);
    }
  };

  const handleSubmit = async (answer) => {
    if (!answer.trim()) return;

    try {
        // You'll need to implement a way to get the current player ID
        const playerId = 'current-player-id'; // Replace with actual player ID logic
        
        const response = await fetch('/api/submitAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                gameId: id,
                playerId,
                answer,
            }),
        });

        const result = await response.json();
        
        if (response.ok) {
            setStage("WAITING");
            setTimeLeft(30);
        } else {
            console.error('Failed to submit answer:', result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
  };

  const renderStage = () => {
    const commonProps = {
      currentRound,
      timeLeft,
      theme: "Things a pirate would say",
      prompt: "BBL",
    };

    switch (stage) {
      case "PREP":
        return <PrepStage {...commonProps} />;
      case "GAME":
        return <GameStage {...commonProps} handleSubmit={handleSubmit} />;
      case "WAITING":
        return (
          <WaitingStage
            {...commonProps}
            yourAnswer={gameData?.answers?.find(a => a.userId === "current-user-id")?.text}
            onProceed={() => setStage("VOTING")}
          />
        );
      case "VOTING":
        return (
          <VotingStage
            {...commonProps}
            answers={gameData?.answers?.map(a => a.text) || []}
            handleVote={(vote) => console.log(vote)}
          />
        );
      case "RESULTS":
        return (
          <ResultsStage
            {...commonProps}
            answers={gameData?.answers || []}
            onNext={handleNextRound}
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
