import React from "react";

export default function PrepStage(props) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen flex-col bg-background-blue">
      <div className="text-center pt-8 pb-0">
        <h1 className="text-center font-sans text-primary-blue text-4xl py-5">
          round {props.currentRound}
        </h1>
        <h3 className="text-2xl font-sans text-primary-blue">
          theme: {props.theme.toLowerCase()}
        </h3>
      </div>
      <div className="text-center pt-30 pb-0">
        <h1 className="text-center text-9xl py-5 font-sans text-primary-blue">
          {props.prompt}
        </h1>
      </div>

      {/* Fixed bottom section with timer */}
      <div className="fixed bottom-0 left-0 right-0 bg-off-white">
        <div className="max-w-md mx-auto flex flex-col items-center p-4">
          <div className="text-6xl font-bold font-sans text-primary-blue">
            {formatTime(props.timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
}