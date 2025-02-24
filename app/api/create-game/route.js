import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.INSTANT_APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN,
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

    const gameId = id();
    await db.transact(
      db.tx.games[gameId].update({
        gameCode,
        status: "waiting",
        players: [],
        roundLength: 30,
        theme: "default",
      })
    );

    const firstRoundId = id();
    // await db.transact(
    //   db.tx.round[firstRoundId].update({
    //     id: firstRoundId,
    //     gameId: gameCode,
    //     roundNumber: 1,
    //     answers: [],
    //     submittedPlayers: [],
    //     votes: [],
    //   }),
    //   db.tx.games[gameId].link({
    //     roundData: firstRoundId
    //   })
    // );
    

    return NextResponse.json({ 
      game,
      firstRoundId 
    }, { status: 200 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
