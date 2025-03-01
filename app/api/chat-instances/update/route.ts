import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateChatInstanceFields } from "@/db/queries/chat-instances-queries";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get chat ID and data from request
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return new NextResponse("Missing chatId", { status: 400 });
    }

    // Parse request body
    const data = await request.json();
    
    // Map duration to backend format
    let duration = data.duration;
    if (duration) {
      // Keep the frontend display format but store the backend format
      // This mapping is based on the requirements
      switch (duration) {
        case "1 minute (quick)":
          duration = "1 minute, 4-5 turns";
          break;
        case "2 minutes (focused)":
          duration = "2 minutes, 8-10 turns";
          break;
        case "3-4 minutes (recommended)":
          duration = "3-4 minutes, 12-16 turns";
          break;
        case "5-6 minutes (balanced)":
          duration = "5-6 minutes, 20-24 turns";
          break;
        case "7-8 minutes (exploratory)":
          duration = "7-8 minutes, 28-32 turns";
          break;
        case "9-10 minutes (deep dive)":
          duration = "9-10 minutes, 36-40 turns";
          break;
      }
    }

    // Update chat instance fields
    const updatedChatInstance = await updateChatInstanceFields(chatId, {
      topic: data.topic,
      duration: duration,
      respondentContacts: data.respondentContacts,
      incentiveStatus: data.incentiveStatus,
      incentiveCode: data.incentiveCode,
      incentiveDescription: data.incentiveDescription,
      additionalDetails: data.additionalDetails,
    });

    logger.info('Chat instance fields updated:', { chatId });
    
    return NextResponse.json(updatedChatInstance);
  } catch (error) {
    logger.error('Error updating chat instance fields:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 