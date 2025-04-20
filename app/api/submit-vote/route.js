// File: app/api/submit-vote/route.js
import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
  adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request, { params }) {
  const { voteData } = await request.json();

  if (!voteData || !voteData.roundId || !voteData.voter || !voteData.votedFor) {
    return NextResponse.json({ error: "Invalid vote data" }, { status: 400 });
  }

  try {
    // First, update the game's votedPlayers array
    const gameQuery = {
      games: {
        $: {
          where: { gameCode: voteData.gameCode },
        },
      },
    };

    const gameData = await db.query(gameQuery);

    if (!gameData?.games?.length) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = gameData.games[0];
    const currentVotedPlayers = game.votedPlayers || [];

    // Only add the voter if they haven't already voted
    if (!currentVotedPlayers.includes(voteData.voter)) {
      await db.transact(
        db.tx.games[game.id].update({
          votedPlayers: [...currentVotedPlayers, voteData.voter],
        })
      );
      console.log(`Updated votedPlayers: ${[...currentVotedPlayers, voteData.voter]}`);
    }

    // Then handle the vote in the round document
    const query = {
      users: {
        $: {
          where: { id: voteData.votedFor },
        },
      },
    };

    const data = await db.query(query);
    console.log("User data:", data);

    const roundData = await db.query({
      round: {
        $: {
          where: { id: voteData.roundId },
        },
      },
    });

    console.log("Round data:", roundData);

    const roundVotes = roundData?.round[0]?.votes || [];
    const player = data?.users[0];

    let vote = {
      voter: voteData.voter,
      votedFor: player?.userName || voteData.votedFor,
    };

    console.log("Vote:", vote);

    await db.transact(
      db.tx.round[voteData.roundId].update({
        votes: [...roundVotes, vote],
      })
    );

    return NextResponse.json({
      message: "Vote submitted successfully",
      votedPlayers: [...currentVotedPlayers, voteData.voter]
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Failed to submit vote", details: error.message },
      { status: 500 }
    );
  }
}