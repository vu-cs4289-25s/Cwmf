// lobby page
"use client";

import Link from "next/link";
import { init } from "@instantdb/react";
import { id as instantID } from "@instantdb/admin";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAcronym } from "../../../utils/acronymGenerator";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({ appId: APP_ID });

export default function LobbyPage() {
  const { id } = useParams();
  const router = useRouter();

  const room = db.room(`lobby-${id}`, id);

  const [userData, setUserData] = useState(null);
  const [gameData, setGameData] = useState({});
  const [editing, setEditing] = useState(false);

  // Game settings
  const [roundTime, setRoundTime] = useState("30 seconds");
  const [theme, setTheme] = useState("Things a pirate would say");
  const [maxRounds, setMaxRounds] = useState(2);

  // Editing game settings
  const [editRoundTime, setEditRoundTime] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editMaxRounds, setEditMaxRounds] = useState(0);

  const { data, isLoading, error } = db.useQuery({
    games: {
      $: {
        where: { gameCode: id },
      },
    },
  });

  useEffect(() => {
    if (data?.games?.length > 0) {
      const game = data.games[0];
      setGameData(game);

      // Check if current player is the host and restore host status
      const currentPlayerId = localStorage.getItem("UUID");
      if (game.hostId === currentPlayerId) {
        localStorage.setItem("host", "true");
      }

      // If game has maxRounds set, use that value
      if (game.maxRounds) {
        setMaxRounds(game.maxRounds);
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

  // Editing session
  useEffect(() => {
    if (editing) {
      setEditTheme(theme);
      setEditRoundTime(roundTime);
      setEditMaxRounds(maxRounds);
    }

    if (!editing) {
      setEditTheme("");
      setEditRoundTime(0);
      setEditMaxRounds(0);
    }
  }, [editing]);

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

  function saveGameSettings() {
    // setTheme(editTheme);
    // setRoundTime(editRoundTime);
    setMaxRounds(editMaxRounds);

    if (userData?.host === "true" && gameData?.id) {
      db.transact(
        db.tx.games[gameData.id].update({
          maxRounds,
        })
      );
    }

    setEditing(false);
  }

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

  const startGame = async () => {
    if (!gameData) return;

    try {
      // Generate the first acronym
      const firstAcronym = getAcronym("pronounceable");

      // Create the first round
      const firstRoundId = instantID();
      await db.transact([
        // Create the round
        db.tx.round[firstRoundId].update({
          id: firstRoundId,
          gameId: gameData.id,
          roundNumber: 1,
          answers: [],
          submittedPlayers: [],
          votes: [],
          theme: "Things a pirate would say",
          prompt: firstAcronym,
        }),
        db.tx.games[gameData.id].link({
          roundData: firstRoundId,
        }),
        // Update game state
        db.tx.games[gameData.id].update({
          status: "active",
          currentStage: "PREP",
          currentRound: 1,
          timerStart: Date.now(),
          timeLeft: 5,
          isTimerRunning: true,
          answers: [],
          scores: {},
          theme: "Things a pirate would say",
          prompt: firstAcronym,
          maxRounds: maxRounds,
          hostId: localStorage.getItem("UUID"), // Store host ID in the game document
        }),
      ]);

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

  if (!myPresence || !userData) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-blue">
      <div className="text-center pt-8 pb-0">
        <h1 className="text-center text-8xl py-5 text-primary-blue font-sans">
          cwmf
        </h1>
        <h3 className="text-2xl font-sans text-primary-blue">
          game code: {id}
        </h3>
      </div>

      <div className="flex flex-1 justify-center items-center gap-20 px-8 -mt-80">
        <div className="bg-off-white shadow-lg rounded-lg p-6 w-80">
          <h2 className="text-xl font-semibold mb-4 text-center font-sans tracking-wide text-primary-blue">
            game settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-primary-blue mb-2 font-sans">
                round time
              </label>
              {userData?.host === "true" && editing ? (
                <select
                  value={editRoundTime}
                  onChange={(e) => setEditRoundTime(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-gray-300 font-sans text-gray-700"
                >
                  {["30 seconds", "1 minute", "2 minutes"].map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-sans text-gray-600">{roundTime}</p>
              )}
            </div>
            <div>
              <label className="block text-primary-blue font-sans mb-2">
                theme
              </label>
              {userData?.host === "true" && editing ? (
                <input
                  value={editTheme}
                  onChange={(e) => setEditTheme(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-gray-300 font-sans text-gray-700"
                />
              ) : (
                <p className="font-sans text-gray-600">{theme}</p>
              )}
            </div>
            {/* New field for max rounds */}
            <div>
              <label className="block text-primary-blue font-sans mb-2">
                number of rounds
              </label>
              {userData?.host === "true" && editing ? (
                <select
                  value={editMaxRounds}
                  onChange={(e) => setEditMaxRounds(e.target.value)}
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
            <div>
              {userData?.host === "true" && (
                <div>
                  {editing ? (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className="flex w-full justify-center rounded-md bg-primary-blue px-3 py-1.5 text-sm/6 font-semibold font-sans tracking-wide text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={saveGameSettings}
                      >
                        save
                      </button>
                      <button
                        type="button"
                        className="flex w-full justify-center rounded-md bg-primary-blue px-3 py-1.5 text-sm/6 font-semibold font-sans tracking-wide text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={() => setEditing(false)}
                      >
                        cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className="flex w-full justify-center rounded-md bg-primary-blue px-3 py-1.5 text-sm/6 font-semibold font-sans tracking-wide text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={() => setEditing(true)}
                      >
                        edit
                      </button>
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
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-wrap gap-8 justify-center max-w-md">
            <ul>
              {gameData?.players &&
                typeof gameData.players === "object" &&
                Object.entries(gameData?.players).map(([playerId, player]) => (
                  <span key={playerId}>
                    <div className="flex flex-col items-center">
                      <div className="inline-flex items-center justify-center size-16 rounded-full ring-2 ring-off-white bg-primary-blue text-off-white mt-4">
                        <span className="text-lg font-sans font-bold">
                          {player.name[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="mt-2 font-sans text-primary-blue">
                        {player.name}
                      </span>
                    </div>
                  </span>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
