"use client";

import {
  emoji,
  emojiNames,
  refsInit,
  animateEmoji,
} from "../../../../utils/emojiUtils"; // adjust path
import React, { useState, useEffect, useRef } from "react";
import Alert from "../../../../components/Alert";
import Narrator from "../../../../components/Narrator";
import { useParams } from "next/navigation";
import { init, Cursors } from "@instantdb/react";
import BackgroundMusic from "../../../../components/BackgroundMusic";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({ appId: APP_ID });

export default function VotingStage(props) {
  const params = useParams();
  const gameCode = params.id;
  const [vote, setVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showNoSubmissionAlert, setShowNoSubmissionAlert] = useState(
    props.showNoSubmissionAlert
  );
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const roundId = params.roundId;

  // State for vote data and tracking
  const [votesData, setVotesData] = useState(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [votedCount, setVotedCount] = useState(0);

  const room = db.room("voting-room", gameCode); // gameCode = roomId
  const publishEmoji = db.rooms.usePublishTopic(room, "emoji");

  const submissionRefs = useRef({});
  const emojiButtonRefs = useRef({});
  const [emojiRefsReady, setEmojiRefsReady] = useState(false);

  const elRefsRef = useRef(refsInit);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVote = async (vote) => {
    try {
      console.log("Submitting vote:", vote);

      const localUser = localStorage.getItem("userName");
      const localUserId = localStorage.getItem("UUID");

      let voteData = {
        voter: localUser,
        voterId: localUserId, // Add the voter ID
        votedFor: vote.playerId,
        roundId: roundId,
      };
      console.log("Vote data:", voteData);

      const response = await fetch("/api/submit-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteData }),
      });

      if (response.ok) {
        setHasVoted(true);
        // After successful vote, fetch the updated vote data
        fetchVoteData();

        // Don't call props.handleVote with autoTransition here
        // Let the parent component handle that through its useEffect
        console.log("Vote submitted successfully");
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  // Add listening for reactions
  db.rooms.useTopicEffect(
    room,
    "emoji",
    ({ name, directionAngle, rotationAngle, targetId }) => {
      const emojiChar = emoji[name];
      if (!emojiChar) return;

      const targetEl = emojiButtonRefs.current?.[targetId]?.[name];
      if (!targetEl) return;

      animateEmoji(
        {
          emoji: emojiChar,
          directionAngle,
          rotationAngle,
        },
        targetEl
      );
    }
  );

  // Function to fetch vote data
  const fetchVoteData = async () => {
    try {
      const response = await fetch(`/api/get-votes?gameCode=${gameCode}&roundId=${roundId}`);

      if (response.ok) {
        const data = await response.json();
        setVotesData(data);

        // Update vote tracking state
        if (data.totalPlayers) {
          setTotalPlayers(data.totalPlayers);
        }

        if (data.votedPlayers) {
          setVotedCount(data.votedPlayers.length);
        }

        // Check if the current user has voted
        const currentUserId = localStorage.getItem("UUID");
        const userHasVoted = data.votedPlayers?.includes(currentUserId);

        if (userHasVoted) {
          setHasVoted(true);
        }

        // ONLY log info about voting progress - don't auto-transition
        // This way we can see what's happening in the console
        if (data.totalPlayers && data.votedPlayers) {
          console.log(`Vote status: ${data.votedPlayers.length}/${data.totalPlayers} players voted`);
        }

        // Let the parent component handle auto-transitioning
        // Don't add auto-transition code here
      }
    } catch (error) {
      console.error("Error fetching vote data:", error);
    }
  };

  // Update the VotingStage component's initialization
  // Add this useEffect to properly set the showNoSubmissionAlert state

  useEffect(() => {
    // Only show the alert if:
    // 1. It was passed as true from the parent (meaning we didn't submit)
    // 2. We're coming from the game stage (not from another round's voting stage)
    const stageFromLocalStorage = localStorage.getItem(`lastStage_${gameCode}`);
    const didSubmit = localStorage.getItem(`didSubmit_${gameCode}_${roundId}`);

    // Check if coming from game stage and didn't submit
    const shouldShowAlert = props.showNoSubmissionAlert &&
      stageFromLocalStorage === "GAME" &&
      didSubmit !== "true";

    console.log("Alert state:", {
      fromProps: props.showNoSubmissionAlert,
      lastStage: stageFromLocalStorage,
      didSubmit,
      shouldShow: shouldShowAlert
    });

    setShowNoSubmissionAlert(shouldShowAlert);

    // Store current stage for next transition
    localStorage.setItem(`lastStage_${gameCode}`, "VOTING");

  }, [props.showNoSubmissionAlert, gameCode, roundId]);

  // Fetch round data with submissions when the component mounts
  useEffect(() => {
    // Update the fetchRoundData function in VotingStage.js
    const fetchRoundData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching round data for roundId:", roundId);

        const response = await fetch(`/api/get-round-data/?roundId=${roundId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch round data");
        }

        const data = await response.json();
        console.log("Got round data:", data);

        if (!data || !data[0]) {
          console.error("No round data returned for roundId:", roundId);
          setIsLoading(false);
          return;
        }

        const roundData = data[0];

        // Check if there are answers directly in the round data
        if (roundData.answers && Array.isArray(roundData.answers) && roundData.answers.length > 0) {
          console.log(`Found ${roundData.answers.length} answers in the round data`);

          // If we have answers but no submissions array, create one
          if (!roundData.submissions || !Array.isArray(roundData.submissions) || roundData.submissions.length === 0) {
            console.log("Creating submissions from answers array");

            // Create submissions from the answers and submittedPlayers arrays
            const submittedPlayers = roundData.submittedPlayers || [];
            const createdSubmissions = [];

            for (let i = 0; i < Math.min(roundData.answers.length, submittedPlayers.length); i++) {
              createdSubmissions.push({
                id: `submission_${roundId}_${i}`,
                playerId: submittedPlayers[i],
                answer: roundData.answers[i],
                roundId: roundId
              });
            }

            console.log("Created submissions:", createdSubmissions);
            setSubmissions(createdSubmissions);
          } else {
            console.log("Using existing submissions array:", roundData.submissions);
            setSubmissions(roundData.submissions);
          }
        } else if (roundData.submissions && Array.isArray(roundData.submissions)) {
          console.log("Using submissions from round data:", roundData.submissions);
          setSubmissions(roundData.submissions);
        } else {
          console.warn("No answers or submissions found in round data");
          setSubmissions([]);
        }

        // After getting submissions, fetch vote data
        await fetchVoteData();
      } catch (error) {
        console.error("Error fetching round data:", error);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoundData();

    // Set up periodic polling for vote data
    const voteInterval = setInterval(fetchVoteData, 3000); // Check every 3 seconds

    return () => clearInterval(voteInterval);
  }, [roundId]);

  // Handle vote submission when time is up
  useEffect(() => {
    if (props.timeLeft === 0 && vote && !hasVoted) {
      handleVote(vote);
      setHasVoted(true);
    }
  }, [props.timeLeft, vote, hasVoted]);

  const handleAlertDismiss = () => {
    console.log("Alert dismissed");
    setShowNoSubmissionAlert(false);
  };

  // Initialize emoji refs when the component mounts
  useEffect(() => {
    const checkRefsReady = () => {
      const ready =
        submissions.length > 0 &&
        submissions.every((s) => emojiButtonRefs.current[s.id]);

      if (ready) {
        setEmojiRefsReady(true);
      } else {
        // Retry shortly in case refs weren't set yet
        setTimeout(checkRefsReady, 50);
      }
    };

    checkRefsReady();
  });

  return (
    <Cursors room={room} className="h-full w-full" userCursorColor="tomato">
      <div style={{ width: "100vw", height: "100vh" }}>
        <div className="flex min-h-screen flex-col bg-background-blue">
          {/* Hidden emoji ref targets */}
          <div className="hidden">
            {emojiNames.map((name) => (
              <div key={name} ref={elRefsRef.current[name]} />
            ))}
          </div>

          {/* Show alert only when showNoSubmissionAlert is true */}
          {showNoSubmissionAlert && (
            <Alert
              message="Time's Up!"
              subtitle="You didn't submit an answer in time. Time to vote on other players' answers..."
              duration={2000}
              onDismiss={handleAlertDismiss}
            />
          )}

          <div className="text-center pt-8 pb-0 px-4">
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
                submissions.map((submission, index) => {
                  const isOwnSubmission =
                    submission.playerId === localStorage.getItem("UUID");

                  return (
                    <div
                      key={submission.id || index}
                      ref={(el) => (submissionRefs.current[submission.id] = el)}
                      className={`${submission.id === vote?.id
                        ? "bg-hover-blue"
                        : "bg-off-white"
                        } w-3/4 rounded-md p-4 transition-colors`}
                    >
                      <p className="text-2xl font-sans text-primary-blue text-center mb-2">
                        {submission.answer}
                      </p>

                      {/* Emoji reaction row */}
                      <div className="flex justify-center gap-4 mt-2">
                        {emojiNames.map((name) => {
                          // Initialize nested ref map
                          if (!emojiButtonRefs.current[submission.id]) {
                            emojiButtonRefs.current[submission.id] = {};
                          }

                          return (
                            <button
                              key={name}
                              ref={(el) =>
                              (emojiButtonRefs.current[submission.id][name] =
                                el)
                              }
                              className="text-2xl hover:scale-110 transition-transform duration-150"
                              onClick={(e) => {
                                const buttonEl = e.currentTarget;

                                const params = {
                                  name,
                                  rotationAngle: Math.random() * 360,
                                  directionAngle: Math.random() * 360,
                                  targetId: submission.id,
                                };

                                animateEmoji(
                                  {
                                    emoji: emoji[name],
                                    rotationAngle: params.rotationAngle,
                                    directionAngle: params.directionAngle,
                                  },
                                  buttonEl
                                );

                                publishEmoji(params);
                              }}
                            >
                              {emoji[name]}
                            </button>
                          );
                        })}
                      </div>

                      {/* Voting button (only for others) */}
                      {!isOwnSubmission && (
                        <button
                          onClick={() => setVote(submission)}
                          className={`mt-3 w-full rounded-md ${vote?.id === submission.id
                            ? "bg-hover-blue"
                            : "bg-primary-blue"
                            } py-2 text-off-white text-xl font-semibold hover:bg-hover-blue transition-colors`}
                        >
                          {vote?.id === submission.id ? "Selected" : "Vote"}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xl font-sans text-gray-600">
                  No submissions for this round yet.
                </p>
              )}

              {vote && !hasVoted && (
                <button
                  onClick={() => {
                    handleVote(vote);
                  }}
                  className="mt-6 px-6 py-3 w-1/2 rounded-md bg-primary-blue text-2xl font-semibold font-sans text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 tracking-wide transition-colors"
                >
                  Submit Vote
                </button>
              )}

              {hasVoted && (
                <div className="mt-6 px-6 py-3 w-1/2 text-center">
                  <p className="text-xl font-sans text-gray-600">
                    Vote submitted! Waiting for others...
                    {totalPlayers > 0 && (
                      <span> ({votedCount}/{totalPlayers})</span>
                    )}
                  </p>
                </div>
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

          {/* Add Narrator */}
          <Narrator
            stage="VOTING"
            currentRound={props.currentRound}
            theme={props.theme}
            prompt={props.prompt}
            timeLeft={props.timeLeft}
            submissions={submissions}
            singleLine={true}
          />
        </div>

        {/* Add Background Music component */}
        <BackgroundMusic
          stage="VOTING"
          enabled={true}
          volume={0.2}
        />
      </div>
    </Cursors>
  );
}