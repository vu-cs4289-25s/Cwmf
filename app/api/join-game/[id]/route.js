import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request, { params }) {
  try {
    const body = await request.json();

    const { user } = body;

    if (!user)
      return NextResponse.json({ error: "user is required" }, { status: 400 });

    const { id } = await params;

    const queryData = await db.query({
      games: {
        $: {
          where: { gameCode: id },
        },
      },
    });

    if (queryData.games.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const game = queryData.games[0];

    game.players.forEach((player) => {
      if (player.name === user.name)
        return NextResponse.json(
          { error: "No duplicate names" },
          { status: 400 }
        );
    });

    let currentPlayers = [user, ...game.players];

    await db.transact(
      db.tx.games[game.id].update({
        players: currentPlayers,
      })
    );

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
