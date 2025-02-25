"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { id, i, init, InstaQLEntity } from "@instantdb/react";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const gameID = useParams().id;
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId");

  const [formData, setFormData] = useState({
    username: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function createHost() {
    let userData = {
      name: formData.username,
      host: true,
      game: gameID,
    };

    const res = await fetch("/api/user", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    const user = data.user;

    localStorage.setItem("UUID", user.UUID);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("host", user.host);
    localStorage.setItem("game", user.game);

    const joinRes = await fetch(`/api/join-game/${gameID}`, {
      method: "POST",
      body: JSON.stringify({ user }),
    });
    const joinData = await joinRes.json();
    if (data.error) {
      setError(data.error);
      return;
    }

    router.push(`/game/${gameID}/lobby`);
  }

  return (
    <>
      <div className="flex h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-background-blue">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-8xl py-5 text-primary-blue font-sans">
            cwmf
          </h1>
          <h3 className="text-2xl font-sans text-primary-blue text-center">
            game code: {gameID}
          </h3>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-xl font-medium text-primary-blue font-sans"
              >
                username
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
                  className="block w-full rounded-md bg-off-white px-3 py-1.5 text-primary-blue font-sans placeholder:text-gray-400 focus:outline-2  focus:outline-primary-blue text-xl h-12"
                />
              </div>
            </div>

            <div className="flex justify-center w-full">
              <button
                className="w-72 rounded-md bg-primary-blue px-3.5 py-2.5 text-2xl font-semibold font-sans text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-16 tracking-wide"
                onClick={() => createHost()}
              >
                start game
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
