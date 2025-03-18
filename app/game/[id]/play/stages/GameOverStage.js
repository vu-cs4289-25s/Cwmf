// app/game/[id]/stages/GameOverStage.js

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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

    // Calculate winner based on vote counts
    const calculateWinner = () => {
        if (!voteData || !voteData.totalVoteCounts) {
            return { winnerName: "Unknown", winnerScore: 0 };
        }

        let highestScore = 0;
        let winnerName = "";

        Object.entries(voteData.totalVoteCounts).forEach(([playerName, score]) => {
            if (score > highestScore) {
                highestScore = score;
                winnerName = playerName;
            }
        });

        return { winnerName, winnerScore: highestScore };
    };

    const { winnerName, winnerScore } = calculateWinner();

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
                        <h3 className="text-3xl font-sans text-primary-blue text-center mb-6">
                            {!winnerName || winnerName === "Unknown" ? "It's a tie!" : `${winnerName} wins!`}
                        </h3>

                        {winnerName && winnerName !== "Unknown" && (
                            <div className="flex justify-center mb-8">
                                <div className="inline-flex items-center justify-center size-24 rounded-full bg-primary-blue text-off-white">
                                    <span className="text-3xl font-sans font-bold">
                                        {winnerName[0]?.toUpperCase() || "?"}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-xl font-sans text-primary-blue mb-4">Final Scores:</h4>
                            <div className="space-y-3">
                                {voteData && voteData.totalVoteCounts &&
                                    Object.entries(voteData.totalVoteCounts)
                                        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                                        .map(([playerName, score]) => (
                                            <div key={playerName} className="flex justify-between items-center">
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
        </div>
    );
}