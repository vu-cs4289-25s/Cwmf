import React, { useState, useEffect } from "react";

export default function WaitingStage(props) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="text-center pt-8 pb-0">
        <h1 className="text-center text-4xl py-5">Round 5</h1>
        <h3 className="text-2xl">Theme: Things a pirate would say</h3>
      </div>
      <div className="text-center pt-30 pb-0">
        <h1 className="text-center text-8xl py-5">Boy Bury Loot!</h1>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
        onClick={props.onProceed}
      >
        Everyone's done early - for demo
      </button>

      {/* Fixed bottom section with input and timer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100">
        {/* Answer submission form */}
        <div className="max-w-md mx-auto p-4">
          <div className="max-w-md mx-auto flex flex-col items-center p-4">
            <div className="text-4xl">Waiting for others to submit... </div>
            <div className="text-6xl font-bold">
              {formatTime(props.timeLeft)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
