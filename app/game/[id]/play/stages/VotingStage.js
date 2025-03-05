// Modified VotingStage.js with explicit alert control
import React, { useState, useEffect } from "react";
import Alert from "../../../../components/Alert";
import { useParams } from "next/navigation";
import { init } from "@instantdb/react";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({ appId: APP_ID });

export default function VotingStage(props) {
  const params = useParams();
  const gameCode = params.id;
  const [vote, setVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [showNoSubmissionAlert, setShowNoSubmissionAlert] = useState(
    props.showNoSubmissionAlert
  );
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const roundId = params.roundId;

  // Debug to confirm alert behavior
  useEffect(() => {
    if (showNoSubmissionAlert) {
      console.log("Alert is showing, will hide in 2 seconds");
    } else {
      console.log("Alert is not showing");
    }
  }, [showNoSubmissionAlert]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVote = async (vote) => {
    try {
      console.log("Submitting vote:", vote);

      const localUser = localStorage.getItem("userName");

      let voteData = {
        gameCode: gameCode,
        voter: localUser,
        votedFor: vote.playerId,
        roundId: roundId,
      };
      console.log(voteData);

      await fetch("/api/submit-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteData }),
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  // Fetch round data with submissions when the component mounts
  useEffect(() => {
    const fetchRoundData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/get-round-data/?roundId=${roundId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch round data");
        }

        const data = await response.json();
        const roundSubmissions = data[0]?.submissions || [];
        setSubmissions(roundSubmissions);
      } catch (error) {
        console.error("Error fetching round data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoundData();
  }, [roundId]);

  // Handle vote submission when time is up
  // This effect will run when the timeLeft prop changes
  // and if the timeLeft is 0, it will call handleVote with the selected vote

  useEffect(() => {
    if (props.timeLeft === 0 && vote) {
      console.log("Submitting vote:", vote);
    }
  }, [props.timeLeft, vote, props]);

  const handleAlertDismiss = () => {
    console.log("Alert dismissed");
    setShowNoSubmissionAlert(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-blue">
      {/* Show alert only when showNoSubmissionAlert is true */}
      {showNoSubmissionAlert && (
        <Alert
          message="Time's Up!"
          subtitle="You didn't submit an answer in time. Time to vote on other players' answers..."
          duration={2000}
          onDismiss={handleAlertDismiss}
        />
      )}

      <div className="text-center pt-8 pb-0">
        <h1 className="text-center text-4xl py-5 font-sans text-primary-blue">
          Round {props.currentRound}
        </h1>
        <h3 className="text-2xl font-sans text-primary-blue">
          Theme: {props.theme}
        </h3>
      </div>
      <div className="text-center pt-30 pb-0">
        <h1 className="text-center text-6xl py-5 font-sans text-primary-blue">
          {props.prompt}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
        </div>
      ) : (
        <div className="flex flex-col mt-10 space-y-5 items-center justify-center pb-32">
          {submissions.length > 0 ? (
            submissions.map((submission, index) => (
              <button
                onClick={() => setVote(submission)}
                key={submission.id || index}
                className={`${
                  submission.id === vote?.id ? "bg-hover-blue" : "bg-off-white"
                } w-3/4 rounded-md p-3 transition-colors`}
              >
                <p className="text-2xl font-sans text-primary-blue">
                  {submission.answer}
                </p>
              </button>
            ))
          ) : (
            <p className="text-xl text-gray-600">
              No submissions for this round yet.
            </p>
          )}
          {vote && hasVoted == false && (
            <button
              onClick={() => {
                handleVote(vote);
                setHasVoted(true);
              }}
              className="bg-blue-500 text-white rounded-md p-3 w-1/2 mt-5"
            >
              Submit Vote
            </button>
          )}
        </div>
      )}

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
