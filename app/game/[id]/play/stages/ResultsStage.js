import React, { useState, useEffect } from "react";

export default function ResultsStage(props) {
  const players = [
    {
      username: "big justice",
      votes: 3,
    },
    {
      username: "grahamcard",
      votes: 2,
    },
    {
      username: "alex",
      votes: 1,
    },
    {
      username: "bbllover123",
      votes: 0,
    },
    {
      username: "sock",
      votes: 0,
    },
  ];
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
      <div className="flex flex-col mt-10 space-y-5 items-center justify-center">
        {players.map((player, index) => (
          <div
            key={index}
            className={`bg-off-white w-3/4 rounded-lg p-3 flex flex-row justify-between`}
          >
            <p className="font-sans text-2xl text-primary-blue">
              {player.username}
            </p>
            <p className="font-sans text-2xl text-primary-blue">
              {player.votes}
            </p>
          </div>
        ))}
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
