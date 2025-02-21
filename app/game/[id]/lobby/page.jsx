//Lobby
"use client";

import Link from "next/link";
import { init, Cursors } from "@instantdb/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";

const db = init({ appId: APP_ID });

async function getGameData(gameCode) {
  const query = {
    games: {
      $: {
        where: { gameCode: gameCode },
      },
    },
  };
  const { data } = await db.queryOnce(query);
  return data.games[0];
}

export default function LobbyPage() {
  const { id } = useParams();

  const room = db.room(`lobby-${id}`, id);

  const [userData, setUserData] = useState(null);
  const [gameData, setGameData] = useState(null);

  const { data, isLoading, error } = db.useQuery({
    games: {
      $: {
        where: { gameCode: id },
      },
    },
  });

  useEffect(() => {
    if (data?.games?.length > 0) {
      setGameData(data.games[0]); // Save game state
    }
  }, [data]); // Runs whenever `data` updates

  useEffect(() => {
    const user = {
      UUID: localStorage.getItem("UUID"),
      name: localStorage.getItem("userName"),
      host: localStorage.getItem("host"),
      game: localStorage.getItem("game"),
    };
    setUserData(user);
  }, []);

  // Publish your presence to the room

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

  if (!myPresence) {
    return <p>App loading...</p>;
  }

  console.log(myPresence);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="text-center pt-8 pb-0">
          <h3 className="text-2xl">Game Code: {id}</h3>
          <h1 className="text-center text-8xl py-5">CWMF</h1>
        </div>

        <div className="flex flex-1 justify-center items-center gap-20 px-8 -mt-80">
          <div className="bg-white shadow-lg rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold mb-4 text-center">
              Game Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Round Time</label>
                <p>30 seconds</p>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Theme</label>
                <p>Things a pirate would say</p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Edit
                </button>
                <Link href="/game/1232321/play" className="w-full">
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Start Game
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap gap-8 justify-center max-w-md">
              <ul>
                {Object.entries(gameData?.players).map(([playerId, player]) => (
                  <span key={playerId}>
                    <div className="flex flex-col items-center">
                      <div className="inline-flex items-center justify-center size-16 rounded-full ring-2 ring-white bg-gray-500 text-white">
                        <span className="text-lg font-medium">BJ</span>
                      </div>
                      <span className="mt-2">{player.name}</span>
                    </div>
                  </span>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
