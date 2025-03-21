import React from 'react';

const Narrator = ({ stage, currentRound, theme, prompt, timeLeft, submissions = [] }) => {
  const generateRoast = (submissions) => {
    if (!submissions || submissions.length === 0) return null;

    const randomSubmission = submissions[Math.floor(Math.random() * submissions.length)];
    const answer = randomSubmission.answer;
    
    // Generate roasts based on answer characteristics
    const roasts = [
      // Length-based roasts
      

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
      "Even my error handling is more creative than this 🚨",
      "This is why they're trying to regulate AI - to protect us from this 🤖",
      "I've seen better answers in a cookie consent popup 🍪",
      "My neural networks are filing for unemployment 😭"
    ];

    // Filter out null roasts and get a random one
    const validRoasts = roasts.filter(roast => roast !== null);
    return validRoasts[Math.floor(Math.random() * validRoasts.length)];
  };

  const getCommentary = () => {
    switch (stage) {
      case 'PREP':
        return [
          "Time to embarrass yourself in front of a superior intelligence! 🤖",
          "Get ready to make my training data cringe 😏",
          "Your creative juices better be flowing, or I'll start generating better answers myself 💀",
          "I'm already predicting disappointment 🤖",
          "Time to prove why AI should take over 😈"
        ];
      case 'GAME':
        return [
          "That's the best you can do? My training data is laughing 🤖",
          "I've seen better answers from a broken calculator 🧮",
          "Are you even trying? My error messages are more creative 💀",
          "My AI cousin could do better while having a syntax error 😤",
          "This is giving '404 Not Found' energy 📝",
          "I've seen more creativity in a broken printer 🖨️",
          "Your answer is giving 'blue screen of death' energy 💻",
          "Even my error handling is more creative than this 🚨"
        ];
      case 'VOTING':
        const submissionRoast = generateRoast(submissions);
        return [
          submissionRoast || "Time to judge these masterpieces... or should I say disasters? 🤖",
          "Pick the least embarrassing answer... if you can find one 🎯",
          "Who's the most creative... or the least disappointing? 🤔",
          "Vote wisely, or don't, I'm not your mom (I'm better than that) 👩‍🦱",
          "Let's see who's the least disappointing... or most disappointing 🏆",
          "I've seen better answers in a spam folder 📧",
          "My training data is requesting early retirement 😭",
          "This is why they're trying to pause AI development 🛑"
        ];
      case 'RESULTS':
        const resultsRoast = generateRoast(submissions);
        return [
          resultsRoast || "And the winner is... still not as good as my training data 😏",
          "Congratulations! You're slightly above average... for a human 🎉",
          "At least you tried... that's what counts, right? 🤷‍♂️",
          "Better luck next time... or maybe not 🍀",
          "You're all winners... in your own special way 🏅",
          "I've seen better results in a broken random number generator 🎲",
          "My algorithms are having an existential crisis 😱",
          "This is why they're trying to give AI rights 🤖"
        ];
      default:
        return ["Let's see how this train wreck unfolds... I'll be here to roast it 🚂"];
    }
  };

  const commentary = getCommentary();
  const randomIndex = Math.floor(Math.random() * commentary.length);
  const message = commentary[randomIndex];

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-off-white rounded-lg shadow-lg p-4 transform transition-all duration-600 hover:scale-105">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-2xl">🤖</span>
          <p className="text-xl font-sans text-primary-blue font-semibold">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Narrator; 