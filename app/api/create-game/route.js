import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
  adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
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
      players: [],
      roundLength: 30,
      status: "active",
      currentStage: "PREP",
      currentRound: 1,
      timerStart: Date.now(),
      timeLeft: 5,
      isTimerRunning: false,
      answers: [],
      scores: {},
      theme: "Things a pirate would say",
      prompt: "BBL",
    };

    const gameId = id();
    await db.transact(
      db.tx.games[gameId].update({
        gameCode,
        players: game.players,
        roundLength: game.roundLength,
        status: game.status,
        currentStage: game.currentStage,
        currentRound: game.currentRound,
        timerStart: game.timerStart,
        timeLeft: game.timeLeft,
        isTimerRunning: game.isTimerRunning,
        answers: game.answers,
        scores: game.scores,
        theme: game.theme,
        prompt: game.prompt,
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
