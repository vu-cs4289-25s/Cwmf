import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: "98c74b4a-d255-4e76-a706-87743b5d7c07",
  adminToken: "b84ac821-3fbc-42ca-a6a3-c22b5cbcc41d",
});

export async function POST(request) {
  try {
    const body = await request.json();

    const { name, host, game } = body;

    if (!name || name === "") {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    } else if (!game || game === "") {
      return NextResponse.json({ error: "game is required" }, { status: 400 });
    } else if (host === undefined) {
      return NextResponse.json({ error: "host is required" }, { status: 400 });
    }

    const UUID = id();
    let user = {
      UUID,
      name,
      host: host,
      game: game,
    };

    await db.transact(
      db.tx.users[UUID].update({
        userName: user.name,
        host: user.host,
        game: user.game,
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
