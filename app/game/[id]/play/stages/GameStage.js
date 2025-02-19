import React, { useState } from "react";

export default function GamePage(props) {
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState("");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    // Set the submitted answer
    setSubmittedAnswer(answer);
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
        <h1 className="text-center text-8xl py-5">{submittedAnswer}</h1>
      </div>

      {/* Show submitted answer if it exists */}
      {submittedAnswer && (
        <div className="text-center mt-8">
          <h2 className="text-2xl">Your answer:</h2>
          <p className="text-4xl mt-2">{submittedAnswer}</p>
        </div>
      )}

      {/* Fixed bottom section with input and timer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100">
        {/* Answer input section */}
        <div className="max-w-md mx-auto p-4">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !submittedAnswer) {
                  handleSubmit();
                }
              }}
              placeholder="Type your answer..."
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              disabled={submittedAnswer !== ""}
            />
            <button
              onClick={handleSubmit}
              className={`w-full py-2 rounded transition-colors ${
                submittedAnswer
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              disabled={submittedAnswer !== ""}
            >
              {submittedAnswer ? "Answer Submitted" : "Submit"}
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="max-w-md mx-auto flex flex-col items-center p-4">
          <div className="text-6xl font-bold">{formatTime(props.timeLeft)}</div>
        </div>
      </div>
    </div>
  );
}
