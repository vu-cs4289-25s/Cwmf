//Lobby
"use client";

import Link from "next/link";
import { init, Cursors } from "@instantdb/react";
import { useEffect, useState } from "react";
const APP_ID = "98c74b4a-d255-4e76-a706-87743b5d7c07";

const db = init({ appId: APP_ID });

const roomId = "default-room";
const room = db.room("lobby", roomId);

const randomId = Math.random().toString(36).slice(2, 6);
const user = {
  name: `User#${randomId}`,
};

async function getGameData(gameCode) {
  const query = {
    games: {
      $: {
        where: { gameCode: gameCode },
      },
    },
  };
  const { isLoading, error, data } = await db.queryOnce(query);
  if (isLoading) {
    return { error: "Loading..." };
  }
  return data.games[0];
}

export default function LobbyPage() {
  const publishChat = db.rooms.usePublishTopic(room, "chat");

  const [chats, setChats] = useState([]);

  db.rooms.useTopicEffect(room, "chat", (chat) => {
    setChats((prevChats) => [...prevChats, chat.chat]);
  });

  const {
    user: myPresence,
    peers,
    publishPresence,
  } = db.rooms.usePresence(room);

  // Publish your presence to the room
  useEffect(() => {
    publishPresence({ name: user.name });
  }, []);

  if (!myPresence) {
    return <p>App loading...</p>;
  }

  console.log(myPresence);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="text-center pt-8 pb-0">
          <h3 className="text-2xl">Game Code: 1232321</h3>
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
                  onClick={() => {
                    setChats((prevChats) => [...prevChats, "Start game"]);
                    publishChat({ chat: "Start game" });
                  }}
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
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center justify-center size-16 rounded-full ring-2 ring-white bg-gray-500 text-white">
                    <span className="text-lg font-medium">You</span>
                  </div>
                  <span className="mt-2">{user.name}</span>
                </div>
                {Object.entries(peers).map(([peerId, peer]) => (
                  <span key={peerId}>
                    <div className="flex flex-col items-center">
                      <div className="inline-flex items-center justify-center size-16 rounded-full ring-2 ring-white bg-gray-500 text-white">
                        <span className="text-lg font-medium">BJ</span>
                      </div>
                      <span className="mt-2">{peer.name}</span>
                    </div>
                  </span>
                ))}
              </ul>
              <div className="bg-gray-100 p-4 rounded-lg w-96">
                {chats.map((chat, index) => (
                  <p key={index} className="text-gray-800">
                    {chat}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
