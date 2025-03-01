import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get chat ID from request
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return new NextResponse("Missing chatId", { status: 400 });
    }

    // Get chat instance
    const chatInstance = await getChatInstanceById(chatId);
    
    if (!chatInstance) {
      return new NextResponse("Chat instance not found", { status: 404 });
    }
    
    // Verify ownership
    if (chatInstance.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Return only the form fields needed for regeneration
    const formData = {
      topic: chatInstance.topic || "",
      duration: chatInstance.duration || "",
      respondentContacts: chatInstance.respondentContacts,
      incentiveStatus: chatInstance.incentiveStatus,
      incentiveCode: chatInstance.incentiveCode || "",
      incentiveDescription: chatInstance.incentiveDescription || "",
      additionalDetails: chatInstance.additionalDetails || "",
    };

    logger.info('Chat instance details fetched for regeneration:', { chatId });
    
    return NextResponse.json(formData);
  } catch (error) {
    logger.error('Error fetching chat instance details:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 