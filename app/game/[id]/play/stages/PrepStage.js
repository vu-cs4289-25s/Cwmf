import React from "react";

export default function PrepPage(props) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen bg-background-blue flex-col">
      <div className="text-center pt-8 pb-0 h-1/12">
        <h1 className="text-center font-sans text-primary-blue text-4xl py-5">
          round {props.currentRound}
        </h1>
        <h3 className="text-2xl font-sans text-primary-blue">
          theme: {props.theme.toLowerCase()}
        </h3>
      </div>
      <div className="text-center h-full flex items-center justify-center">
        <h1 className="text-center text-9xl py-5 font-sans text-primary-blue">
          {props.prompt}
        </h1>
      </div>

      {/* Timer section */}
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
