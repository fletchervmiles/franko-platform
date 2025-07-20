import { NextResponse } from "next/server";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Chat instance ID required", { status: 400 });
    }

    const chatInstance = await getChatInstanceById(id);
    
    // Return 404 if chat doesn't exist
    if (!chatInstance) {
      return new NextResponse("Chat instance not found", { status: 404 });
    }

    // Check if chat instance has a conversation plan
    if (!chatInstance.conversationPlan) {
      return new NextResponse("Chat instance is not ready", { status: 400 });
    }

    logger.info('Chat instance validated:', { id });
    
    return new NextResponse("Chat instance is valid", { status: 200 });
  } catch (error) {
    logger.error('Error validating chat instance:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
} 