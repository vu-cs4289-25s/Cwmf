import { init, id as generateId } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
  adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const data = await db.query({
      games: {
        $: {
          where: { gameCode: id },
        },
      },
    });
    if (data.games.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const game = data.games[0];
    const gameId = game.id;
    const firstRoundId = generateId();

    console.log("Game ID:", gameId);
    console.log("First Round ID:", firstRoundId);
    await db.transact(
      db.tx.round[firstRoundId].update({
        gameId: gameId,
        roundNumber: 1,
        answers: [],
        submittedPlayers: [],
        votes: [],
      }),
      db.tx.games[gameId].link({
        roundData: firstRoundId,
      })
    );

    await db.transact(
      db.tx.games[gameId].update({
        shouldRedirect: true,
        redirectTo: `/game/${id}/play/${firstRoundId}`,
      })
    );

    return NextResponse.json({ firstRoundId: firstRoundId }, { status: 200 });
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}
