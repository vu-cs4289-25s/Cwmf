import React from "react";

export default function WaitingStage(props) {
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

      {/* Show submitted answer */}
      <div className="flex h-full justify-center mt-8">
        <div className="bg-off-white rounded-lg p-6 max-w-md w-full h-16 mx-4">
          <h3 className="text-lg text-gray-600 mb-2 font-sans">Your answer:</h3>
          <p className="text-2xl font-semibold font-sans text-primary-blue">
            {props.submittedAnswer}
          </p>
        </div>
      </div>

      {/* Fixed bottom section with timer */}
      <div className="justify-self-end w-full p-6 h-36 bg-off-white">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <p className="text-gray-600 font-sans text-2xl text-center">
            Waiting for others to submit...
          </p>
          <div className="text-6xl font-bold text-primary-blue font-sans">
            {formatTime(props.timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
}
