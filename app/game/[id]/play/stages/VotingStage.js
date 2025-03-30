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

      let voteData = {
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
  useEffect(() => {
    if (props.timeLeft === 0 && vote) {
      console.log("Submitting vote:", vote);
    }
  }, [props.timeLeft, vote, props]);

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
        // Retry shortly in case refs weren’t set yet
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
                          className="mt-3 w-full rounded-md bg-primary-blue py-2 text-off-white text-xl font-semibold hover:bg-hover-blue transition-colors"
                        >
                          Vote
                        </button>
                      )}
                    </div>
                  );
                })
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
                  className="mt-6 px-6 py-3 w-1/2 rounded-md bg-primary-blue text-2xl font-semibold font-sans text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 tracking-wide transition-colors"
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

          {/* Add Narrator component */}
          <Narrator
            stage="VOTING"
            currentRound={props.currentRound}
            theme={props.theme}
            prompt={props.prompt}
            timeLeft={props.timeLeft}
            submissions={submissions}
          />
        </div>
      </div>
    </Cursors>
  );
}
