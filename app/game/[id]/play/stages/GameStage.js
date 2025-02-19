import React, { useState, useEffect } from "react";

export default function GamePage(props) {
  const [answer, setAnswer] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (props.timeLeft === 0 && !answer) {
      setShowAlert(true);
      // Auto-submit empty answer after 2 seconds
      const timeout = setTimeout(() => {
        props.handleSubmit("");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [props.timeLeft, answer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    props.handleSubmit(answer);
    setAnswer("");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Alert */}
      {showAlert && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg max-w-md mx-4">
            <div className="flex items-center">
              <div className="text-lg font-bold">Time's Up!</div>
            </div>
            <div className="mt-2">
              You didn't submit an answer in time. Moving to the next stage...
            </div>
          </div>
        </div>
      )}

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
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              autoComplete="off"
              disabled={showAlert}
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={showAlert}
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