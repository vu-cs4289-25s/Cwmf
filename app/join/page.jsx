//join/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { id, i, init, InstaQLEntity } from "@instantdb/react";

const APP_ID = "7f057877-f350-4ab6-9568-2e4c235c37a2";

const db = init({ appId: APP_ID });

async function joinGame(gameCode, userName) {
  console.log("Joining game:", gameCode, userName);
  const query = {
    games: {
      $: {
        where: { gameCode: gameCode },
      },
    },
  };

  try {
    const { isLoading, error, data } = await db.queryOnce(query);
    if (isLoading) {
      console.log("Loading...");
      return;
    }

    console.log(data);

    db.transact(
      db.tx.games[data.games[0].id].update({
        players: [...data.games[0].players, userName],
      })
    );
  } catch (error) {
    console.error("Error joining game:", error);
  }
}

export default function AccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    code: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const gameCode = formData.code;
    const userName = formData.username;

    console.log("Joining game:", gameCode, userName);

    const query = {
      games: {
        $: {
          where: { gameCode: gameCode },
        },
      },
    };

    const { data } = await db.queryOnce(query);
    const game = data.games[0];

    for (let player of game.players) {
      if (player.name === userName) {
        setError("Username already taken");
        return;
      }
    }

    try {
      const UUID = id();

      let user = {
        UUID,
        name: userName,
        host: false,
        game: gameCode,
      };
      db.transact(
        db.tx.users[UUID].update({
          userName,
          host: false,
          game: gameCode,
        })
      );

      localStorage.setItem("UUID", UUID);
      localStorage.setItem("userName", userName);
      localStorage.setItem("host", false);
      localStorage.setItem("game", game.gameCode);

      db.transact(
        db.tx.games[data.games[0].id].update({
          players: [...data.games[0].players, user],
        })
      );

      router.push(`/game/${formData.code}/lobby`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-8xl py-5">CWMF</h1>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm/6 font-medium text-gray-900"
              >
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  autoComplete="username"
                  className="block w-full rounded-md bg-gray-200 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="code"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Game Code
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={handleInputChange}
                  className="block w-full rounded-md bg-gray-200 px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                //onClick={() => joinGame(formData.code, formData.username)}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
