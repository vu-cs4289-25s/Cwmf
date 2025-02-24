import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: "98c74b4a-d255-4e76-a706-87743b5d7c07",
  adminToken: "b84ac821-3fbc-42ca-a6a3-c22b5cbcc41d",
});

export async function POST(request, { params }) {
  try {
    const { id } = params;
    await db.transact(
      db.tx.games[id].update({
        shouldRedirect: true,
        redirectTo: `/game/${id}/play`,
      })
    );
    return NextResponse.json({ status: 200 });
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}
