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
    // Get the voterId if it's provided, otherwise use voter name to find the user
    const voterId = voteData.voterId || null;

    // Query the user data for the player being voted for
    const userQuery = {
      users: {
        $: {
          where: { id: voteData.votedFor },
        },
      },
    };
    const userData = await db.query(userQuery);
    const player = userData?.users[0];

    // Query the round data
    const roundQuery = {
      round: {
        $: {
          where: { id: voteData.roundId },
        },
      },
    };
    const roundData = await db.query(roundQuery);
    const round = roundData?.round[0];

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    // Find the related game
    const gameQuery = {
      games: {
        $: {
          where: { id: round.gameId },
        },
      },
    };
    const gameData = await db.query(gameQuery);
    const game = gameData?.games[0];

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Prepare the vote object
    const vote = {
      voter: voteData.voter,
      voterId: voterId, // Include the voter ID
      votedFor: player?.userName || voteData.votedFor,
      votedForId: voteData.votedFor,
      timestamp: Date.now(),
    };

    // Get current votes array or initialize if it doesn't exist
    const roundVotes = round.votes || [];
    let updatedVotes = [...roundVotes];

    // Check if this voter has already voted
    const existingVoteIndex = updatedVotes.findIndex(
      v => (v.voterId && v.voterId === voterId) || (!v.voterId && v.voter === voteData.voter)
    );

    if (existingVoteIndex >= 0) {
      // Update existing vote
      updatedVotes[existingVoteIndex] = vote;
    } else {
      // Add new vote
      updatedVotes.push(vote);
    }

    // Track voted players in the game object
    const votedPlayers = game.votedPlayers || [];
    let updatedVotedPlayers = [...votedPlayers];

    // Add voterId to votedPlayers if not already there
    if (voterId && !updatedVotedPlayers.includes(voterId)) {
      updatedVotedPlayers.push(voterId);
    }

    // Perform both updates in a transaction
    await db.transact([
      // Update the round with the new vote
      db.tx.round[voteData.roundId].update({
        votes: updatedVotes,
      }),

      // Update the game's votedPlayers array
      db.tx.games[game.id].update({
        votedPlayers: updatedVotedPlayers,
      }),
    ]);

    // Calculate vote counts for response
    const voteCounts = {};
    updatedVotes.forEach(v => {
      const recipient = v.votedFor;
      voteCounts[recipient] = (voteCounts[recipient] || 0) + 1;
    });

    return NextResponse.json({
      message: "Vote submitted successfully",
      voteCounts,
      totalVotes: updatedVotes.length,
      votedPlayers: updatedVotedPlayers
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Failed to submit vote", details: error.message },
      { status: 500 }
    );
  }
}