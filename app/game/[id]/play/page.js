// app/game/[id]/play/page.js
"use client";
import { useState, useEffect } from "react";

// Import your existing pages as components
import PrepStage from "./stages/PrepStage";
import GameStage from "./stages/GameStage";
import WaitingStage from "./stages/WaitingStage";
import VotingStage from "./stages/VotingStage";
import ResultsStage from "./stages/ResultsStage";
import ShowSubmissionsStage from "./stages/ShowSubmissionsStage";

export default function PlayPage({ params }) {
  const [stage, setStage] = useState("PREP");
  const [currentRound, setCurrentRound] = useState(5);
  const [timeLeft, setTimeLeft] = useState(5);
  const [answers, setAnswers] = useState([
    "bbl",
    "big booty lover",
    "bur bro ll",
  ]);

  // Timer logic can be shared across stages
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(interval);
          // Auto-advance to next stage when timer runs out
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const handleTimeUp = () => {
    switch (stage) {
      case "PREP":
        setStage("GAME");
        setTimeLeft(30); // Reset timer for game stage
        break;
      case "WAITING":
        setStage("VOTING");
        setTimeLeft(45); // Set voting time
        break;
      case "VOTING":
        setStage("RESULTS");
        setTimeLeft(5); // Set results time?
        break;
      case "RESULTS":
        // Move to next round or end game
        handleNextRound();
        break;
    }
  };

  const handleNextRound = () => {
    setCurrentRound((prev) => prev + 1);
    setStage("PREP");
    setTimeLeft(30);
    setAnswers([]);
  };

  const handleSubmitAnswer = (answer) => {
    console.log(answer);
    setAnswers((prev) => [...prev, answer]);
    setStage("WAITING");
  };

  const renderStage = () => {
    const commonProps = {
      currentRound,
      timeLeft,
      theme: "Things a pirate would say",
      prompt: "BBL",
      users: [],
    };

    switch (stage) {
      case "PREP":
        return <PrepStage {...commonProps} />;
      case "GAME":
        return <GameStage {...commonProps} handleSubmit={handleSubmitAnswer} />;
      case "WAITING":
        return (
          <WaitingStage
            {...commonProps}
            onProceed={() => {
              // temporary, later this will happen after everyone submits
              console.log("show!!");
              setStage("VOTING");
            }}
          />
        );
      case "VOTING":
        return (
          <VotingStage
            {...commonProps}
            answers={answers}
            handleVote={(vote) => console.log(vote)}
          />
        );
      case "RESULTS":
        return (
          <ResultsStage
            {...commonProps}
            answers={answers}
            onNext={handleNextRound}
          />
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return <div className="min-h-screen">{renderStage()}</div>;
}
