//app/page.jsx
"use client";

import Link from "next/link";
import { id, i, init, InstaQLEntity } from "@instantdb/react";
import { useRouter } from "next/navigation";
import { join } from "path";
import { useEffect } from "react";

// ID for app: cwmf
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;

const db = init({ appId: APP_ID });

function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem("UUID", "");
    localStorage.setItem("userName", "");
    localStorage.setItem("host", false);
    localStorage.setItem("game", "");
  }, []);

  async function createGame() {
    try {
      const res = await fetch("/api/create-game", {
        method: "POST",
      });
      const data = await res.json();
      const gameCode = data.game.gameCode;

      // Navigate to the game page
      router.push(`/game/${gameCode}/create`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  }

  return (
    <div className="h-screen">
      <header className="bg-white">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8 h-10"
        >
          <div className="flex lg:flex-1"></div>
          <div className="flex flex-row">
            <div className="lg:flex lg:flex-1 lg:justify-end px-5">
              <a href="#" className="text-sm/6 font-semibold text-gray-900">
                Account
              </a>
            </div>
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
        <div className="mx-auto max-w-3xl flex h-full">
          <div className="w-full m-auto justify-center items-center flex flex-col">
            <h1 className="text-center text-8xl py-5">CWMF</h1>
            <Link className="w-full" href="/join">
              <button
                type="button"
                className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-12 w-md mb-4"
              >
                Join Game
              </button>
            </Link>
            <button
              type="button"
              className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-12 w-md"
              onClick={() => createGame()}
            >
              Create Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
