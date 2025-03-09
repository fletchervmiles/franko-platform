import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createInternalChatSession } from "@/db/queries/internal-chat-sessions-queries";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatInstanceIds, title = "Response Analysis" } = await request.json();
    
    if (!chatInstanceIds || !Array.isArray(chatInstanceIds) || chatInstanceIds.length === 0) {
      return NextResponse.json(
        { error: "Chat instance IDs are required" },
        { status: 400 }
      );
    }

    const session = await createInternalChatSession({
      userId,
      title,
      selectedResponses: chatInstanceIds,
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error creating internal chat session:", error);
    return NextResponse.json(
      { error: "Failed to create internal chat session" },
      { status: 500 }
    );
  }
}