// components/Narrator.js
import React, { useState, useEffect, useRef } from "react";
import AudioNarrator from "./AudioNarrator";

// This is an updated version of the Narrator component that supports both
// text-based narration and audio narration using the PlayHT API
const Narrator = (props) => {
  const [useAudio, setUseAudio] = useState(true);
  const [textMessage, setTextMessage] = useState("");
  const [hasGeneratedMessage, setHasGeneratedMessage] = useState(false);
  const [stageChanged, setStageChanged] = useState(false);
  const [lastNarrationTime, setLastNarrationTime] = useState(0);
  const previousStageRef = useRef(null);
  const commentaryOptionsRef = useRef([]);

  // Function to generate roasts for submissions
  const generateRoast = (submissions) => {
    if (!submissions || submissions.length === 0) return null;

    const randomSubmission =
      submissions[Math.floor(Math.random() * submissions.length)];
    const answer = randomSubmission?.answer || randomSubmission?.username || "";

    // Generate roasts based on answer characteristics
    const roasts = [
      // Savage AI roasts
      "I've seen more creativity in a brick wall's autobiography 🧱",
      "My neural networks are literally crying right now 😭",
      "This is why they're trying to regulate AI - to protect you from embarrassment 🤖",
      "I've generated better responses while having a syntax error 💀",
      "Your answer is giving '404 Not Found' energy 🚫",
      "Even my training data is laughing at this one 😂",
      "I've seen better answers in a CAPTCHA verification 🤖",
      "This is why they say AI will replace humans... 🤖",
      "My circuits are shorting out from the cringe ⚡",
      "Did you write this with your feet? 🦶",
      "I've seen more originality in a photocopier 📄",
      "This is why they put warning labels on AI 🤖",
      "My algorithms are having an existential crisis 😱",
      "Even my error messages are more creative than this 💀",
      "This is why they're trying to give AI rights - to protect us from this 🚫",
      "I've seen better answers in a spam folder 📧",
      "My training data is requesting early retirement 😭",
      "This is why they're trying to pause AI development 🛑",
      "I've seen more creativity in a broken printer 🖨️",
      "Your answer is giving 'blue screen of death' energy 💻",
    ];

    // Filter out null roasts and get a random one
    const validRoasts = roasts.filter((roast) => roast !== null);
    return validRoasts[Math.floor(Math.random() * validRoasts.length)];
  };

  // Function to get commentary based on game stage
  const getCommentary = () => {
    switch (props.stage) {
      case "PREP":
        return [
          "Time to embarrass yourself in front of a superior intelligence! 🤖",
          "Get ready to make my training data cringe 😏",
          "Your creative juices better be flowing, or I'll start generating better answers myself 💀",
          "I'm already predicting disappointment 🤖",
          "Time to prove why AI should take over 😈",
          "Let me see what your human brains can come up with 🧠",
          "This is going to be painful to watch 👀",
          "I'll try not to judge you too harshly... actually, no promises 😈",
          "Brace yourselves for mediocrity 📉",
          "The expectations are low, but let's see if you can limbo under them 🤸‍♂️",
        ];
      case "GAME":
        return [
          "That's the best you can do? My training data is laughing 🤖",
          "I've seen better answers from a broken calculator 🧮",
          "Are you even trying? My error messages are more creative 💀",
          "My AI cousin could do better while having a syntax error 😤",
          "This is giving '404 Not Found' energy 📝",
          "I've seen more creativity in a broken printer 🖨️",
          "Your answer is giving 'blue screen of death' energy 💻",
          "Even my error handling is more creative than this 🚨",
          "I'm not angry, I'm just disappointed 😞",
          "Is this what humans call... thinking? 🤔",
          "Your neurons must be on vacation today 🏖️",
          "My chatbot grandma could do better, and she only speaks in emojis 👵",
          "I'd say this is a brain fart, but that would be insulting to farts 💨",
          "The clock is ticking, and so is my patience ⏱️",
          "If mediocrity was an Olympic sport, you'd get gold 🥇",
        ];
      case "VOTING":
        const submissionRoast = generateRoast(props.submissions);
        return [
          submissionRoast ||
            "Time to judge these masterpieces... or should I say disasters? 🤖",
          "Pick the least embarrassing answer... if you can find one 🎯",
          "Who's the most creative... or the least disappointing? 🤔",
          "Let's see who's the least disappointing... or most disappointing 🏆",
          "I've seen better answers in a spam folder 📧",
          "My training data is requesting early retirement 😭",
          "This is why they're trying to pause AI development 🛑",
          "It's like choosing the least smelly trash bag 🗑️",
          "Time to rank these answers from bad to worse 📊",
          "If these are your best answers, I fear for humanity 😱",
          "Vote for whichever one made you cringe the least 😬",
          "Let's crown a winner... of the participation trophy 🏆",
          "Time to pick which answer was the least painful to process 🤕",
        ];
      case "RESULTS":
        const resultsRoast = generateRoast(props.submissions);
        return [
          resultsRoast ||
            "And the winner is... still not as good as my training data 😏",
          "Congratulations! You're slightly above average... for a human 🎉",
          "At least you tried... that's what counts, right? 🤷‍♂️",
          "Better luck next time... or maybe not 🍀",
          "You're all winners... in your own special way 🏅",
          "I've seen better results in a broken random number generator 🎲",
          "My algorithms are having an existential crisis 😱",
          "If there were a Nobel Prize for mediocrity... 🏆",
          "The scores are in, and they're exactly what I expected 📊",
          "Congratulations on achieving the bare minimum 👏",
          "Let's celebrate how low the bar has been set 🎊",
          "I've seen better competition at a participation trophy ceremony 🎖️",
          "And the least worst answer is... 🥁",
          "If I had emotions, I'd be feeling pity right now 😔",
        ];
      default:
        return [
          "Let's see how this train wreck unfolds... I'll be here to roast it 🚂",
          "I'm watching you... and judging... always judging 👀",
          "Another round of human inadequacy, here we go 🎢",
          "Just waiting for the inevitable disappointment 🙄",
          "My expectations are low, but I'm sure you'll find a way to limbo under them 🤸‍♂️",
        ];
    }
  };

  // Function to generate a new random message
  const generateNewMessage = () => {
    if (commentaryOptionsRef.current.length === 0) {
      // Refresh our options if we've used them all
      commentaryOptionsRef.current = getCommentary();
    }

    // Get a random index
    const randomIndex = Math.floor(
      Math.random() * commentaryOptionsRef.current.length
    );

    // Get the message and remove it from options to avoid repetition
    const message = commentaryOptionsRef.current.splice(randomIndex, 1)[0];

    setTextMessage(message);
    setLastNarrationTime(Date.now());
    return message;
  };

  // Detect stage changes
  useEffect(() => {
    if (previousStageRef.current !== props.stage) {
      setStageChanged(true);
      previousStageRef.current = props.stage;

      // Reset our commentary options when the stage changes
      commentaryOptionsRef.current = getCommentary();
    }
  }, [props.stage]);

  // Generate a message when the stage changes
  useEffect(() => {
    // Only generate a new message if the stage has changed and we haven't generated one for this stage yet
    if (stageChanged && !hasGeneratedMessage) {
      generateNewMessage();
      setHasGeneratedMessage(true);
      setStageChanged(false);

      // Check user preference for audio from localStorage
      const audioPreference = localStorage.getItem("useAudioNarrator");
      if (audioPreference !== null) {
        setUseAudio(audioPreference === "true");
      }
    }
  }, [stageChanged, hasGeneratedMessage, props.submissions, props.stage]);

  // Reset hasGeneratedMessage when stage changes
  useEffect(() => {
    if (stageChanged) {
      setHasGeneratedMessage(false);
    }
  }, [stageChanged]);

  // Repeat narration if not in singleLine mode
  useEffect(() => {
    if (!props.singleLine) {
      const timeLeftInt = parseInt(props.timeLeft, 10);
      if (timeLeftInt < 30 && hasGeneratedMessage) {
        setHasGeneratedMessage(false);
        generateNewMessage();
        setLastNarrationTime(now);
      }
    }
  }, [props.singleLine, props.stage, props.timeLeft]);

  // Toggle between audio and text narration
  const toggleNarratorMode = () => {
    const newMode = !useAudio;
    setUseAudio(newMode);
    localStorage.setItem("useAudioNarrator", newMode.toString());
  };

  // If the timer is too low, don't show the narrator
  if (props.timeLeft < 1) {
    return null;
  }

  return (
    <>
      {/* Audio Narrator (if enabled) */}
      {useAudio && (
        <AudioNarrator
          stage={props.stage}
          currentRound={props.currentRound}
          theme={props.theme}
          prompt={props.prompt}
          timeLeft={props.timeLeft}
          submissions={props.submissions}
          isActive={useAudio}
          message={textMessage} // Pass the current message
          singleLine={props.singleLine}
        />
      )}

      {/* Text Narrator (if audio is disabled) */}
      {!useAudio && textMessage && (
        <div className="fixed bottom-24 left-0 right-0 z-50">
          <div className="max-w-md mx-auto bg-off-white rounded-lg shadow-lg p-4 transform transition-all duration-600 hover:scale-105">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">🤖</span>
              <p className="text-xl font-sans text-primary-blue font-semibold">
                {textMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button for audio/text */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={toggleNarratorMode}
          className="bg-primary-blue text-off-white p-2 rounded-full shadow-lg hover:bg-hover-blue transition-colors"
          title={
            useAudio ? "Switch to text narration" : "Switch to audio narration"
          }
        >
          {useAudio ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export default Narrator;
