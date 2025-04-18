// app/game/[id]/stages/GameOverStage.js
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import BackgroundMusic from "../../../../components/BackgroundMusic";
import musicService from "../../../../utils/musicService";

export default function GameOverStage(props) {
    const router = useRouter();
    const params = useParams();
    const [secondsLeft, setSecondsLeft] = useState(10);
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

    // Auto-redirect after 10 seconds with countdown
    useEffect(() => {
        // Store the current host status before redirecting
        const isHost = localStorage.getItem("host");

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Redirect when timer reaches zero
        const redirectTimer = setTimeout(() => {
            if (props.redirectPath) {
                if (musicService) {
                    musicService.stopAllMusic();
                }
                // Make sure host status is preserved before redirecting
                if (isHost === "true") {
                    localStorage.setItem("host", "true");
                }

                router.push(props.redirectPath);
            }
        }, 10000); // Redirect after 10 seconds

        return () => {
            clearInterval(countdownInterval);
            clearTimeout(redirectTimer);
        };
    }, [props.redirectPath, router]);

    // Calculate winner(s) based on vote counts with proper tie handling
    const calculateWinners = () => {
        if (!voteData || !voteData.totalVoteCounts || Object.keys(voteData.totalVoteCounts).length === 0) {
            return { winners: [], highestScore: 0, isTie: false };
        }

        let highestScore = 0;
        let winners = [];

        // First, find the highest score
        Object.entries(voteData.totalVoteCounts).forEach(([playerName, score]) => {
            if (score > highestScore) {
                highestScore = score;
            }
        });

        // Then, collect all players with that score
        Object.entries(voteData.totalVoteCounts).forEach(([playerName, score]) => {
            if (score === highestScore) {
                winners.push(playerName);
            }
        });

        // Check if it's a tie
        const isTie = winners.length > 1;

        return { winners, highestScore, isTie };
    };

    const { winners, highestScore, isTie } = calculateWinners();

    // Create submissions array for Narrator
    const playerScores = voteData && voteData.totalVoteCounts
        ? Object.entries(voteData.totalVoteCounts)
            .map(([username, votes]) => ({ username, votes }))
            .sort((a, b) => b.votes - a.votes)
        : [];

    return (
        <div className="flex h-screen flex-col bg-background-blue">
            <div className="text-center pt-8 pb-0">
                <h1 className="text-center font-sans text-primary-blue text-6xl py-5">
                    Game Over!
                </h1>
                <h2 className="text-4xl font-sans text-primary-blue">
                    Final Results
                </h2>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
                {isLoading ? (
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
                    </div>
                ) : (
                    <div className="bg-off-white rounded-lg p-8 shadow-lg max-w-md">
                        {winners.length > 0 ? (
                            <>
                                <h3 className="text-3xl font-sans text-primary-blue text-center mb-6">
                                    {isTie
                                        ? `It's a ${winners.length}-way tie!`
                                        : `${winners[0]} wins!`}
                                </h3>

                                {isTie ? (
                                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                                        {winners.map((winner, index) => (
                                            <div key={index} className="flex flex-col items-center">
                                                <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary-blue text-off-white">
                                                    <span className="text-xl font-sans font-bold">
                                                        {winner[0]?.toUpperCase() || "?"}
                                                    </span>
                                                </div>
                                                <span className="mt-2 text-sm font-sans text-primary-blue">{winner}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : winners.length === 1 && (
                                    <div className="flex justify-center mb-8">
                                        <div className="inline-flex items-center justify-center size-24 rounded-full bg-primary-blue text-off-white">
                                            <span className="text-3xl font-sans font-bold">
                                                {winners[0][0]?.toUpperCase() || "?"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <h3 className="text-3xl font-sans text-primary-blue text-center mb-6">
                                No winners found
                            </h3>
                        )}

                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-xl font-sans text-primary-blue mb-4">Final Scores:</h4>
                            <div className="space-y-3">
                                {voteData && voteData.totalVoteCounts &&
                                    Object.entries(voteData.totalVoteCounts)
                                        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                                        .map(([playerName, score]) => (
                                            <div key={playerName}
                                                className={`flex justify-between items-center p-2 rounded ${winners.includes(playerName) ? 'bg-blue-100' : ''
                                                    }`}
                                            >
                                                <span className="font-sans text-lg text-primary-blue">{playerName}</span>
                                                <span className="font-sans font-bold text-xl text-primary-blue">{score}</span>
                                            </div>
                                        ))
                                }
                            </div>
                        </div>
                    </div>
                )}

                <p className="mt-8 text-gray-600 font-sans">
                    Returning to lobby in {secondsLeft} seconds...
                </p>
            </div>

            {/* Add Background Music component */}
            <BackgroundMusic
                stage="GAME_OVER"
                enabled={true}
                volume={0.2}
            />
        </div>
    );
}