import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getConversationPlan, updateChatInstanceConversationPlan } from "@/db/queries/chat-instances-queries";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return new NextResponse("Missing chatId", { status: 400 });
    }

    const plan = await getConversationPlan(chatId);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error getting conversation plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return new NextResponse("Missing chatId", { status: 400 });
    }

    const data = await request.json();
    const updatedPlan = await updateChatInstanceConversationPlan(chatId, data);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating conversation plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 