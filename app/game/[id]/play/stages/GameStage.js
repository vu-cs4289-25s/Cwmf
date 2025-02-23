import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function GamePage(props) {
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const params = useParams();
  const gameId = params.id;
  const roundId = params.roundId;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle timer reaching zero - move directly to voting if no submission
  useEffect(() => {
    if (props.timeLeft === 0 && !answer) {
      handleSubmitAnswer(""); // Empty submission
    }
  }, [props.timeLeft, answer]);

  const handleSubmitAnswer = async (answerText) => {
    try {
      const playerId = localStorage.getItem("UUID"); // Get the player's UUID
      
      const response = await fetch('/api/submitAnswer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameCode: gameId,
          playerId: playerId,
          answer: answerText,
          roundId: roundId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      setSubmittedAnswer(answerText);
      props.handleSubmit(answerText); // Call the parent handler if needed
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      handleSubmitAnswer(answer);
      setAnswer(""); // Clear the input
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="text-center pt-8 pb-0">
        <h1 className="text-center text-4xl py-5">
          Round {props.currentRound}
        </h1>
        <h3 className="text-2xl">Theme: {props.theme}</h3>
      </div>
      <div className="text-center pt-30 pb-0">
        <h1 className="text-center text-8xl py-5">{props.prompt}</h1>
      </div>

      {/* Show submitted answer if it exists */}
      {submittedAnswer ? (
        <div className="text-center mt-8">
          <h2 className="text-2xl">Your answer:</h2>
          <p className="text-4xl mt-2">{submittedAnswer}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col items-center mt-8">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-3/4 p-3 text-xl border rounded"
            placeholder="Type your answer..."
          />
          <button 
            type="submit"
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      )}

      {/* Fixed bottom section with timer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100">
        <div className="max-w-md mx-auto flex flex-col items-center p-4">
          <div className="text-6xl font-bold">{formatTime(props.timeLeft)}</div>
        </div>
      </div>
    </div>
  );
}