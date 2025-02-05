import React, { useState } from "react";

export default function GamePage(props) {
  const [answer, setAnswer] = useState("");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle submission logic here
    props.handleSubmit(answer);
    setAnswer("");
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

      {/* Fixed bottom section with input and timer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100">
        {/* Answer submission form */}
        <div className="max-w-md mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>
          </form>
        </div>

        {/* Timer */}
        <div className="max-w-md mx-auto flex flex-col items-center p-4">
          <div className="text-6xl font-bold">{formatTime(props.timeLeft)}</div>
        </div>
      </div>
    </div>
  );
}
