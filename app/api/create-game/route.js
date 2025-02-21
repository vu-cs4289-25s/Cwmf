import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: "98c74b4a-d255-4e76-a706-87743b5d7c07",
  adminToken: "b84ac821-3fbc-42ca-a6a3-c22b5cbcc41d",
});

export async function POST(request) {
  try {
    // Check if the request has a body
    const contentLength = request.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      /*return NextResponse.json(
        { error: "Game settings required" },
        { status: 400 }
      );*/
    }

    const gameCode = Math.floor(Math.random() * 900000 + 100000).toString();

    // const { data } = await request.json();
    // const roundLength = data.roundLength;
    // const theme = data.theme;

    let game = {
      gameCode,
      status: "waiting",
      players: [],
      roundLength: 30,
      theme: "default",
    };
    /*
        const UUID = id();
        let user = {
            UUID,
            name: userName,
            host: true,
            game: gameCode,
        };

        await db.transact(
            db.tx.users[UUID].update({
                userName: user.name,
                host: user.host,
                game: user.game,
            })
        ); */

    await db.transact(
      db.tx.games[id()].update({
        gameCode,
        status: "waiting",
        players: [],
        roundLength: 30,
        theme: "default",
      })
    );

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
