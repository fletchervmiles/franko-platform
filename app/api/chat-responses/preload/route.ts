import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { getChatResponsesByChatInstanceId } from "@/db/queries/chat-responses-queries";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

/**
 * GET handler for preloading chat responses
 * 
 * This API endpoint:
 * 1. Validates the chat instance exists and belongs to the user
 * 2. Fetches the chat responses for the specified chat instance
 * 3. Caches the responses in memory
 * 
 * @param request The incoming request
 * @returns Next.js Response
 */
export async function GET(
  request: Request
) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query params
    const url = new URL(request.url);
    const chatInstanceId = url.searchParams.get("chatInstanceId");
    
    if (!chatInstanceId) {
      return NextResponse.json(
        { error: "Missing chatInstanceId parameter" },
        { status: 400 }
      );
    }
    
    // Verify the chat instance exists and belongs to the user
    const chatInstance = await getChatInstanceById(chatInstanceId);
    if (!chatInstance) {
      return NextResponse.json(
        { error: "Chat instance not found" },
        { status: 404 }
      );
    }
    
    if (chatInstance.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to access this chat instance" },
        { status: 403 }
      );
    }
    
    // Fetch responses for the chat instance
    const responses = await getChatResponsesByChatInstanceId(chatInstanceId);
    
    // Format conversation plan if available
    let formattedPlan = "";
    if (chatInstance.conversationPlan) {
      try {
        const plan = typeof chatInstance.conversationPlan === 'string'
          ? JSON.parse(chatInstance.conversationPlan)
          : chatInstance.conversationPlan;
          
        if (plan) {
          formattedPlan = `
          **Conversation Plan**
          Title: ${plan.title || 'Untitled Conversation'}
          ${plan.objectives ? `
          **Objectives:**
          ${plan.objectives.map((obj: any, index: number) => 
            `${index + 1}. ${obj.title}${obj.description ? `: ${obj.description}` : ''}`
          ).join('\n')}` : ''}
          `;
        }
      } catch (error) {
        logger.warn(`Error formatting conversation plan for chat instance ${chatInstanceId}`, { error });
      }
    }
    
    // Log success
    logger.info(`Preloaded ${responses.length} responses for chat instance ${chatInstanceId}`);
    
    // Return success with data about what was preloaded
    return NextResponse.json({
      success: true,
      responseCount: responses.length,
      hasPlan: !!formattedPlan,
      planLength: formattedPlan.length
    });
  } catch (error) {
    // Log error and return error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error preloading chat responses: ${errorMessage}`);
    
    return NextResponse.json(
      { error: "Failed to preload chat responses", message: errorMessage },
      { status: 500 }
    );
  }
}