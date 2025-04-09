import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Narrator from "../../../../components/Narrator";

export default function ResultsStage(props) {
  const params = useParams();
  const [voteData, setVoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch vote data when component mounts
  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/get-votes?gameCode=${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch vote data");
        }

        const data = await response.json();
        setVoteData(data);
      } catch (error) {
        console.error("Error fetching vote data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoteData();
  }, [params.id]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Create an array of players with their vote counts
  const getPlayerScores = () => {
    if (!voteData || !voteData.totalVoteCounts) {
      return [];
    }

    return Object.entries(voteData.totalVoteCounts)
      .map(([username, votes]) => ({ username, votes }))
      .sort((a, b) => b.votes - a.votes); // Sort by votes in descending order
  };

  const playerScores = getPlayerScores();

  return (
    <div className="flex h-screen flex-col bg-background-blue">
      <div className="text-center pt-8 pb-0">
        <h1 className="text-center font-sans text-primary-blue text-4xl py-5">
          round {props.currentRound}
        </h1>
        <h3 className="text-2xl px-4 font-sans text-primary-blue">
          theme: {props.theme.toLowerCase()}
        </h3>
      </div>
      <div className="text-center pt-30 pb-0">
        <h1 className="text-center text-9xl py-5 font-sans text-primary-blue">
          {props.prompt}
        </h1>
      </div>

      <div className="flex flex-col mt-4 md:mt-10 space-y-5 overflow-y-auto flex-grow px-6 md:px-24 py-1 max-h-[300px] md:max-h-96">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
          </div>
        ) : playerScores.length > 0 ? (
          playerScores.map((player, index) => (
            <div
              key={index}
              className={`bg-off-white w-full rounded-lg p-2 md:p-3 flex flex-row justify-between ${
                index === 0 ? "ring-2 ring-primary-blue" : ""
              }`}
            >
              <p className="font-sans text-lg md:text-2xl text-primary-blue">
                {player.username}
              </p>
              <p className="font-sans text-lg md:text-2xl text-primary-blue">
                {player.votes}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xl text-gray-600">
            No votes recorded for this round yet.
          </p>
        )}
      </div>

      {/* Fixed bottom section with timer */}
      <div className="fixed bottom-0 left-0 right-0 bg-off-white">
        <div className="max-w-md mx-auto flex flex-col items-center p-4">
          <div className="text-6xl font-bold font-sans text-primary-blue">
            {formatTime(props.timeLeft)}
          </div>
        </div>
      </div>

      {/* Add Narrator component */}

      <Narrator
        stage="RESULTS"
        currentRound={props.currentRound}
        theme={props.theme}
        prompt={props.prompt}
        timeLeft={props.timeLeft}
        submissions={playerScores}
      />
    </div>
  );
}
