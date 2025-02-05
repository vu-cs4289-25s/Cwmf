import React from "react";

export default function PrepPage(props) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

      {/* Timer section */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gray-100">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="text-6xl font-bold">{formatTime(props.timeLeft)}</div>
        </div>
      </div>
    </div>
  );
}
