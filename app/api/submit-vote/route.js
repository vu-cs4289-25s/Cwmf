import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
  adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request, { params }) {
  const { voteData } = await request.json();

  console.log("Vote data:", voteData);
  if (
    !voteData ||
    !voteData.gameCode ||
    !voteData.voter ||
    !voteData.votedFor
  ) {
    return NextResponse.json({ error: "Invalid vote data" }, { status: 400 });
  }

  const query = {
    users: {
      $: {
        where: { id: voteData.votedFor },
      },
    },
  };

  try {
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

    const roundVotes = roundData?.round[0]?.votes;
    const player = data?.users[0];

    let vote = {
      voter: voteData.voter,
      votedFor: player.userName,
    };

    console.log("Vote:", vote);

    await db.transact(
      db.tx.round[voteData.roundId].update({
        votes: [...roundVotes, vote],
      })
    );

    return NextResponse.json({ message: "Vote submitted successfully" });
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}
