import { init, id } from "@instantdb/admin";
import { NextResponse } from "next/server";

const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
  adminToken: process.env.NEXT_PUBLIC_INSTANT_APP_ADMIN_TOKEN,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;
    const { sender } = body;
    const { chatId } = body;

    if (!message || !sender || !chatId) {
      return NextResponse.json(
        { error: "message, sender, and chatID are required" },
        { status: 400 }
      );
    }

    const messageId = id();
    await db.transact([
      db.tx.messages[messageId].update({
        message: message,
        sender: sender,
      }),

      db.tx.messages[messageId].link({
        chat: chatId,
      }),
    ]);

    return NextResponse.json(
      { message: "Message sent successfully", messageId: messageId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
