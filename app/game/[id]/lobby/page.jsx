"use client";

import Link from "next/link";
import { init } from "@instantdb/react";
import { id as instantID } from "@instantdb/admin";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAcronym } from "../../../utils/acronymGenerator";
import {
  getAllThemes,
  getRandomTheme,
  getDefaultTheme,
} from "../../../utils/themeBank";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({ appId: APP_ID });

export default function LobbyPage() {
  const { id } = useParams();
  const router = useRouter();

  const room = db.room(`lobby-${id}`, id);

  const [userData, setUserData] = useState(null);
  const [gameData, setGameData] = useState({});
  const [chatData, setChatData] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [maxRounds, setMaxRounds] = useState(2);
  const [selectedTheme, setSelectedTheme] = useState(getDefaultTheme());
  const [useRandomThemes, setUseRandomThemes] = useState(false);
  const [themeOptions, setThemeOptions] = useState([]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [customThemeText, setCustomThemeText] = useState("");
  const [customThemes, setCustomThemes] = useState([]);
  const [showCustomThemesDropdown, setShowCustomThemesDropdown] =
    useState(false);

  const { data, isLoading, error } = db.useQuery({
    games: {
      chat: {
        messages: {},
      },
      $: {
        where: { gameCode: id },
      },
    },
  });

  useEffect(() => {
    // Load all available themes
    setThemeOptions(getAllThemes());
  }, []);

  useEffect(() => {
    if (data?.games?.length > 0) {
      const game = data.games[0];
      setGameData(game);

      const chat = game.chat[0];
      setChatData(chat);

      const messages = chat.messages;
      setChatMessages(messages);

      // Check if current player is the host and restore host status
      const currentPlayerId = localStorage.getItem("UUID");
      if (game.hostId === currentPlayerId) {
        localStorage.setItem("host", "true");
      }

      // If game has maxRounds set, use that value
      if (game.maxRounds) {
        setMaxRounds(game.maxRounds);
      }

      // Load theme settings if they exist
      if (game.theme) {
        setSelectedTheme(game.theme);

        // Check if this is a custom theme (not in our standard list)
        const isCustom = !getAllThemes().includes(game.theme);
        setIsCustomTheme(isCustom);
        if (isCustom) {
          setCustomThemeText(game.theme);
        }
      }

      if (game.useRandomThemes !== undefined) {
        setUseRandomThemes(game.useRandomThemes);
      }

      // Load custom themes if they exist
      if (game.customThemes && Array.isArray(game.customThemes)) {
        setCustomThemes(game.customThemes);
      }

      // Handle redirect for all players
      if (game.shouldRedirect && game.redirectTo) {
        router.push(game.redirectTo);
      }
    }
  }, [data, router]);

  useEffect(() => {
    const user = {
      UUID: localStorage.getItem("UUID"),
      name: localStorage.getItem("userName"),
      host: localStorage.getItem("host"),
      game: localStorage.getItem("game"),
    };
    setUserData(user);
  }, []);

  const {
    user: myPresence,
    peers,
    publishPresence,
  } = db.rooms.usePresence(room);

  useEffect(() => {
    if (userData) {
      publishPresence({ name: userData.name });
    }
  }, [userData, publishPresence]);

  const handleMaxRoundsChange = (value) => {
    const newValue = parseInt(value, 10);
    if (!isNaN(newValue) && newValue > 0) {
      setMaxRounds(newValue);

      // If user is host, update the game settings
      if (userData?.host === "true" && gameData?.id) {
        db.transact(
          db.tx.games[gameData.id].update({
            maxRounds: newValue,
          })
        );
      }
    }
  };

  const handleThemeChange = (value) => {
    setSelectedTheme(value);
    setIsCustomTheme(false);

    // If user is host, update the game settings
    if (userData?.host === "true" && gameData?.id) {
      db.transact(
        db.tx.games[gameData.id].update({
          theme: value,
        })
      );
    }
  };

  const handleRandomThemeToggle = (checked) => {
    setUseRandomThemes(checked);

    // If user is host, update the game settings
    if (userData?.host === "true" && gameData?.id) {
      db.transact(
        db.tx.games[gameData.id].update({
          useRandomThemes: checked,
        })
      );
    }
  };

  const toggleThemeSelector = () => {
    setShowThemeSelector(!showThemeSelector);
    setShowCustomThemesDropdown(false);
  };

  const toggleCustomThemesDropdown = () => {
    setShowCustomThemesDropdown(!showCustomThemesDropdown);
    setShowThemeSelector(false);
  };

  const toggleCustomTheme = () => {
    setIsCustomTheme(!isCustomTheme);
    if (!isCustomTheme) {
      setShowThemeSelector(false);
      setShowCustomThemesDropdown(false);
    }
  };

  const handleCustomThemeChange = (value) => {
    setCustomThemeText(value);

    // Update selected theme in real-time
    if (value.trim()) {
      setSelectedTheme(value);

      // If user is host, update the game settings
      if (userData?.host === "true" && gameData?.id) {
        db.transact(
          db.tx.games[gameData.id].update({
            theme: value,
          })
        );
      }
    }
  };

  const saveCustomTheme = () => {
    if (customThemeText.trim() && !customThemes.includes(customThemeText)) {
      const updatedCustomThemes = [...customThemes, customThemeText];
      setCustomThemes(updatedCustomThemes);

      // If user is host, update the game settings
      if (userData?.host === "true" && gameData?.id) {
        db.transact(
          db.tx.games[gameData.id].update({
            customThemes: updatedCustomThemes,
          })
        );
      }
    }
  };

  const startGame = async () => {
    if (!gameData) return;

    try {
      // Debug logs to verify settings
      console.log("Starting game with custom themes:", customThemes);
      console.log("Random themes enabled:", useRandomThemes);

      // Generate the first acronym
      const firstAcronym = getAcronym("pronounceable");

      let usedStandardThemes = [];

      // Determine the theme for the first round
      let firstRoundTheme = selectedTheme;

      if (customThemes.length > 0) {
        firstRoundTheme = customThemes[0];
      } else {
        // If random themes but no custom themes, use random standard theme
        const themeObject = getRandomTheme();
        firstRoundTheme = themeObject.theme;
        usedStandardThemes.push(themeObject.index);
      }

      // Create the first round
      const firstRoundId = instantID();

      // Prepare game state object
      const gameStateObject = {
        status: "active",
        currentStage: "PREP",
        currentRound: 1,
        timerStart: Date.now(),
        timeLeft: 5,
        isTimerRunning: true,
        answers: [],
        scores: {},
        theme: firstRoundTheme,
        currentRoundTheme: firstRoundTheme,
        prompt: firstAcronym,
        maxRounds: maxRounds,
        useRandomThemes: useRandomThemes,
        customThemes: customThemes.length > 0 ? [...customThemes] : [],
        currentCustomThemeIndex: 0,
        usedStandardThemes: usedStandardThemes ? [...usedStandardThemes] : [],
        hostId: localStorage.getItem("UUID"),
      };

      console.log(
        "Initial game state:",
        JSON.stringify(gameStateObject, null, 2)
      );

      await db.transact([
        // Create the round
        db.tx.round[firstRoundId].update({
          id: firstRoundId,
          gameId: gameData.id,
          roundNumber: 1,
          answers: [],
          submittedPlayers: [],
          votes: [],
          theme: firstRoundTheme,
          prompt: firstAcronym,
        }),

        // Link the round to the game
        db.tx.games[gameData.id].link({
          roundData: firstRoundId,
        }),

        // Update game state
        db.tx.games[gameData.id].update(gameStateObject),
      ]);

      console.log("Game started with initial theme:", firstRoundTheme);

      // Redirect all players to the game with roundId
      await db.transact(
        db.tx.games[gameData.id].update({
          shouldRedirect: true,
          redirectTo: `/game/${id}/play/${firstRoundId}`,
        })
      );

      router.push(`/game/${id}/play/${firstRoundId}`);
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const sendMessage = async (message) => {
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sender: userData.name,
          chatId: chatData.id,
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!myPresence || !userData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-blue">
      {/* Header section - responsive text sizes */}
      <div className="text-center pt-4 sm:pt-8 pb-0">
        <h1 className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl py-3 sm:py-5 text-primary-blue font-sans">
          cwmf
        </h1>
        <h3 className="text-lg sm:text-xl md:text-2xl font-sans text-primary-blue">
          game code: {id}
        </h3>
      </div>

      <div className="flex flex-1 justify-center items-center gap-20 px-8 -mt-75">
        <div className="flex flex-col w-96 h-96 bg-white rounded-lg shadow-lg p-4 space-y-4">
          <div className="font-sans text-lg text-primary-blue font-semibold">
            Lobby Chat
          </div>

          <div
            id="chat-box"
            className="flex-1 overflow-y-auto border border-gray-300 rounded p-2 space-y-2"
          >
            {chatMessages &&
              chatMessages.map((message, index) => (
                <div key={index} className="text-sm text-gray-800">
                  {message.sender}: {message.message}
                </div>
              ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-primary-blue text-white text-sm rounded hover:bg-hover-blue"
              onClick={() => {
                sendMessage(chatMessage);
                setChatMessage("");
              }}
            >
              Send
            </button>
          </div>
        </div>

        <div className="bg-off-white shadow-lg rounded-lg p-6 w-80">
          <h2 className="text-xl font-semibold mb-4 text-center font-sans tracking-wide text-primary-blue">
            game settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-primary-blue mb-2 font-sans">
                round time
              </label>
              <p className="font-sans text-gray-600">30 seconds</p>
            </div>

            {/* Theme selection */}
            <div>
              <label className="block text-primary-blue font-sans mb-2">
                theme
              </label>
              {userData?.host === "true" ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="randomThemes"
                      checked={useRandomThemes}
                      onChange={(e) =>
                        handleRandomThemeToggle(e.target.checked)
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="randomThemes"
                      className="font-sans text-gray-600"
                    >
                      Use random themes each round
                    </label>
                  </div>

                  {!useRandomThemes && (
                    <div>
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="customTheme"
                          checked={isCustomTheme}
                          onChange={() => toggleCustomTheme()}
                          className="mr-2"
                        />
                        <label
                          htmlFor="customTheme"
                          className="font-sans text-gray-600"
                        >
                          Create custom theme
                        </label>
                      </div>

                      {isCustomTheme ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={customThemeText}
                            onChange={(e) =>
                              handleCustomThemeChange(e.target.value)
                            }
                            placeholder="Enter a custom theme..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-sans text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={saveCustomTheme}
                              disabled={
                                !customThemeText.trim() ||
                                customThemes.includes(customThemeText)
                              }
                              className="flex-1 px-3 py-1 bg-primary-blue text-off-white rounded-md text-sm font-sans disabled:opacity-50"
                            >
                              Save
                            </button>

                            {customThemes.length > 0 && (
                              <div className="relative flex-1">
                                <button
                                  onClick={toggleCustomThemesDropdown}
                                  className="w-full px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-sans flex items-center justify-between"
                                >
                                  <span>Saved</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {showCustomThemesDropdown && (
                                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-32 overflow-y-auto">
                                    {customThemes.map((theme, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          handleThemeChange(theme);
                                          setCustomThemeText(theme);
                                          setShowCustomThemesDropdown(false);
                                        }}
                                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                      >
                                        {theme}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div
                            onClick={toggleThemeSelector}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-sans text-sm text-gray-600 truncate">
                              {selectedTheme}
                            </span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>

                          {showThemeSelector && (
                            <div className="mt-1 border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white">
                              {themeOptions.map((theme, index) => (
                                <div
                                  key={index}
                                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                                    selectedTheme === theme ? "bg-gray-100" : ""
                                  }`}
                                  onClick={() => {
                                    handleThemeChange(theme);
                                    setShowThemeSelector(false);
                                  }}
                                >
                                  {theme}
                                </div>
                              ))}

                              {customThemes.length > 0 && (
                                <>
                                  <div className="px-3 py-1 bg-gray-200 text-xs font-semibold">
                                    Your Custom Themes
                                  </div>
                                  {customThemes.map((theme, index) => (
                                    <div
                                      key={`custom-${index}`}
                                      className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                                        selectedTheme === theme
                                          ? "bg-gray-100"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        handleThemeChange(theme);
                                        setShowThemeSelector(false);
                                      }}
                                    >
                                      {theme}
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-sans text-gray-600">
                    {useRandomThemes
                      ? "Random themes each round"
                      : selectedTheme}
                  </p>
                </div>
              )}
            </div>

            {/* Max rounds setting */}
            <div>
              <label className="block text-primary-blue font-sans mb-2">
                number of rounds
              </label>
              {userData?.host === "true" ? (
                <select
                  value={maxRounds}
                  onChange={(e) => handleMaxRoundsChange(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-gray-300 font-sans text-gray-700"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-sans text-gray-600">{maxRounds}</p>
              )}
            </div>

            {/* Buttons for host */}
            {userData?.host === "true" && (
              <div className="flex gap-4">
                <button
                  type="button"
                  className="flex w-full justify-center rounded-md bg-primary-blue px-3 py-1.5 text-sm/6 font-semibold font-sans tracking-wide text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  onClick={startGame}
                >
                  start game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Players section - responsive grid */}
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-3 gap-4 sm:gap-6 justify-center max-w-md">
            {gameData?.players &&
              typeof gameData.players === "object" &&
              Object.entries(gameData?.players).map(([playerId, player]) => (
                <div key={playerId} className="flex flex-col items-center">
                  <div className="inline-flex items-center justify-center size-12 sm:size-16 rounded-full ring-2 ring-off-white bg-primary-blue text-off-white">
                    <span className="text-base sm:text-lg font-sans font-bold">
                      {player.name[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="mt-2 font-sans text-primary-blue text-sm sm:text-base truncate max-w-24">
                    {player.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
