//Lobby
import Link from "next/link";
import { init } from "@instantdb/react";
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
    const { isLoading, error, data } = await db.queryOnce(query);
    if (isLoading) {
        return { error: 'Loading...' };
    }
    return data.games[0];
}
export default function LobbyPage() {
    return (
        <>
            <div className="flex min-h-screen flex-col">
                <div className="text-center pt-8 pb-0">
                    <h3 className="text-2xl">Game Code: 1232321</h3>
                    <h1 className="text-center text-8xl py-5">CWMF</h1>
                </div>

                <div className="flex flex-1 justify-center items-center gap-20 px-8 -mt-80">
                    <div className="bg-white shadow-lg rounded-lg p-6 w-80">
                        <h2 className="text-xl font-bold mb-4 text-center">Game Settings</h2>
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
                            <div className="flex flex-col items-center">
                                <div className="inline-flex items-center justify-center size-16 rounded-full ring-2 ring-white bg-gray-500 text-white">
                                    <span className="text-lg font-medium">BJ</span>
                                </div>
                                <span className="mt-2">Big Justice</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="inline-flex items-center justify-center size-20 rounded-full ring-2 ring-white bg-gray-500 text-white">
                                    <span className="text-lg font-medium">BJ</span>
                                </div>
                                <span className="mt-2">Bigger Justice</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="inline-flex items-center justify-center size-24 rounded-full ring-2 ring-white bg-gray-500 text-white">
                                    <span className="text-lg font-medium">BJ</span>
                                </div>
                                <span className="mt-2">Biggest Justice</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}