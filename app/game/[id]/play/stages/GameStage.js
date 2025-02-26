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

      // Save the answer to localStorage for the current round
      localStorage.setItem(`answer_${gameId}_${props.currentRound}`, answerText);

      const response = await fetch('/api/submitAnswer', {
        method: 'POST',

      const response = await fetch("/api/submitAnswer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameCode: gameId,
          playerId: playerId,
          answer: answerText,
          roundId: roundId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      setSubmittedAnswer(answerText);
      props.handleSubmit(answerText); // Call the parent handler if needed
    } catch (error) {
      console.error("Error submitting answer:", error);
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
    <div className="flex h-screen flex-col bg-background-blue">
      <div className="text-center pt-8 pb-0 h-1/12">
        <h1 className="text-center font-sans text-primary-blue text-4xl py-5">
          round {props.currentRound}
        </h1>
        <h3 className="text-2xl font-sans text-primary-blue">
          theme: {props.theme.toLowerCase()}
        </h3>
      </div>
      <div className="text-center h-full flex items-center justify-center flex-col">
        <h1 className="text-center text-9xl py-5 font-sans text-primary-blue">
          {props.prompt}
        </h1>
        {submittedAnswer ? (
          <div className="text-center mt-8">
            <h2 className="text-2xl">Your answer:</h2>
            <p className="text-4xl mt-2">{submittedAnswer}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center w-1/3 mt-8"
          >
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="block w-full rounded-md bg-off-white px-3 py-1.5 text-primary-blue font-sans placeholder:text-gray-600 placeholder:font-sans focus:outline-2  focus:outline-primary-blue text-xl h-12"
              placeholder="Type your answer..."
            />
            <button
              type="submit"
              className="mt-4 px-6 py-2 w-full rounded-md bg-primary-blue text-2xl font-semibold font-sans text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-16 tracking-wide"
            >
              Submit
            </button>
          </form>
        )}
      </div>

      {/* Fixed bottom section with timer */}
      <div className="justify-self-end w-full p-6 h-36 bg-off-white">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="text-6xl font-bold text-primary-blue font-sans">
            {formatTime(props.timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
}
