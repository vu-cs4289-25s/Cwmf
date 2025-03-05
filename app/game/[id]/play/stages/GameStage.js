import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function GameStage(props) {
  const [answer, setAnswer] = useState("");
  const [answerWords, setAnswerWords] = useState([]);
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [promptLetters, setPromptLetters] = useState([]);
  const [answerErrorMsg, setAnswerErrorMsg] = useState("");

  const params = useParams();
  const gameId = params.id;
  const roundId = params.roundId;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    setPromptLetters(props.prompt.split(""));

    let initialAnswerWords = [];
    for (let i = 0; i < props.prompt.length; i++) {
      initialAnswerWords.push("");
    }
    setAnswerWords(initialAnswerWords);
  }, []);

  // Handle timer reaching zero - move directly to voting if no submission
  useEffect(() => {
    if (props.timeLeft === 0 && !answer) {
      handleSubmitAnswer(""); // Empty submission
    }
  }, [props.timeLeft, answer]);

  const handleSubmitAnswer = async (answerText) => {
    try {
      const playerId = localStorage.getItem("UUID"); // Get the player's UUID

      // Save the answer to localStorage for the current round
      localStorage.setItem(
        `answer_${gameId}_${props.currentRound}`,
        answerText
      );

      const response = await fetch("/api/submitAnswer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameCode: gameId,
          playerId: playerId,
          answer: answerText,
          roundId: roundId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      setSubmittedAnswer(answerText);
      props.handleSubmit(answerText); // Call the parent handler if needed
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  function validateAnswer() {
    for (let i = 0; i < promptLetters.length; i++) {
      const word = answerWords[i];
      if (word === "") {
        setAnswerErrorMsg("All words must be filled.");
        break;
      } else if (!/^[a-zA-Z]+$/.test(word)) {
        setAnswerErrorMsg("Answers may only contain letters.");
        break;
      } else if (!word.toUpperCase().startsWith(promptLetters[i])) {
        setAnswerErrorMsg("Word must start with corresponding letter.");
        break;
      } else {
        return true;
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAnswer()) {
      let buildAnswer = "";

      for (const word of answerWords) {
        buildAnswer += ` ${word}`;
      }

      setAnswer(buildAnswer);
    }

    if (answer.trim()) {
      handleSubmitAnswer(answer);
      setAnswer(""); // Clear the input
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background-blue">
      <div className="text-center pt-8 pb-0 h-1/12">
        <h1 className="text-center font-sans text-primary-blue text-4xl py-5">
          round {props.currentRound}
        </h1>
        <h3 className="text-2xl font-sans text-primary-blue">
          theme: {props.theme.toLowerCase()}
        </h3>
      </div>
      <div className="text-center h-full flex items-center justify-center flex-col">
        <h1 className="text-center text-9xl mb-24 py-5 font-sans text-primary-blue">
          {props.prompt}
        </h1>
        {submittedAnswer ? (
          <div className="text-center mt-8">
            <h2 className="text-2xl">Your answer:</h2>
            <p className="text-4xl mt-2">{submittedAnswer}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center w-5/12 mt-8"
          >
            <div className="flex flex-col gap-y-5 w-full items-center mb-10">
              {promptLetters.map((letter, index) => {
                return (
                  <div key={index} className="flex flex-row w-full">
                    <p className="font-sans text-5xl text-primary-blue mr-6">
                      {letter}
                    </p>
                    <input
                      className="block w-full rounded-md bg-off-white px-3 py-1.5 text-primary-blue font-sans placeholder:text-gray-500 placeholder:font-sans focus:outline-2  focus:outline-primary-blue text-xl h-12"
                      onChange={(e) => {
                        setAnswerErrorMsg("");
                        let words = [...answerWords];
                        words[index] = e.target.value.trim();
                        setAnswerWords(words);
                      }}
                      placeholder={
                        "Enter a word that begins with " + letter + "..."
                      }
                    />
                  </div>
                );
              })}
            </div>
            {answerErrorMsg && (
              <p className="text-red-700 font-sans text-xl">{answerErrorMsg}</p>
            )}
            <button
              type="submit"
              className="mt-4 px-6 py-2 w-full rounded-md bg-primary-blue text-2xl font-semibold font-sans text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-16 tracking-wide"
            >
              Submit
            </button>
          </form>
        )}
      </div>

      {/* Fixed bottom section with timer */}
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
