//join/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { id, i, init, InstaQLEntity } from "@instantdb/react";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

const db = init({ appId: APP_ID });

async function joinGame(user) {
  try {
    const res = await fetch(`/api/join-game/${user.game}`, {
      method: "POST",
      body: JSON.stringify({ user }),
    });
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
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

    try {
      let user = {
        name: userName,
        host: false,
        game: gameCode,
      };

      const res = await fetch("/api/user", {
        method: "POST",
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      user = data.user;

      localStorage.setItem("UUID", user.UUID);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("host", user.host);
      localStorage.setItem("game", user.game);

      await joinGame(user);

      router.push(`/game/${formData.code}/lobby`);
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-background-blue">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-8xl py-5 text-primary-blue font-sans">cwmf</h1>
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

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="code"
                  className="block text-xl font-medium text-primary-blue font-sans"
                >
                  game code
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
                  className="block w-full rounded-md bg-off-white px-3 py-1.5 text-primary-blue font-sans placeholder:text-gray-400 focus:outline-2  focus:outline-primary-blue text-xl h-12"
                />
              </div>
            </div>

   
              <div className="flex justify-center w-full">
                <button
                  type="submit"
                  className="w-72 rounded-md bg-primary-blue px-3.5 py-2.5 text-2xl font-semibold font-sans text-off-white shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-16 tracking-wide"
                  //onClick={() => joinGame(formData.code, formData.username)}
                >
                  submit
                </button>
              </div>
     
          </form>
        </div>
      </div>
    </>
  );
}
