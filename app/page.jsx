//app/page.jsx
"use client";

import Link from "next/link";
import { id, i, init, InstaQLEntity } from "@instantdb/react";
import { useRouter } from "next/navigation";
import { join } from "path";
import { useEffect } from "react";

// ID for app: cwmf
const APP_ID = "7f057877-f350-4ab6-9568-2e4c235c37a2";

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
    <div className="h-screen bg-background-blue">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-screen">
        <div className="mx-auto max-w-3xl flex h-full">
          <div className="w-full m-auto justify-center items-center flex flex-col">
            <h1 className="text-center text-8xl py-5 text-primary-blue font-sans">cwmf</h1>
            <Link href="/join">
              <button
                type="button"
                className="w-72 rounded-md bg-primary-blue px-3.5 py-2.5 text-2xl font-semibold font-sans text-button-text shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-16 mb-4 tracking-wide"
              >
                Join Game
              </button>
            </Link>
            <button
              type="button"
              className="w-72 rounded-md bg-primary-blue px-3.5 py-2.5 text-2xl font-semibold font-sans text-button-text shadow-xs hover:bg-hover-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 h-16 tracking-wide"
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
