/**
 * Create Internal Chat Session API Route
 * 
 * This endpoint handles the creation of new internal chat sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createInternalChatSession } from "@/db/queries/internal-chat-sessions-queries";
import { logger } from "@/lib/logger";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { getChatResponsesByChatInstanceId } from "@/db/queries/chat-responses-queries";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      logger.error("Unauthorized access attempt to create internal chat session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { chatInstanceId, chatInstanceIds, responseIds } = body;

    let selectedResponseIds = responseIds;
    let chatIdToUse = chatInstanceId;
    
    // Handle multi-instance selection (new format)
    if (chatInstanceIds && chatInstanceIds.length > 0) {
      // If specific chat instances are provided, use the first one for title
      chatIdToUse = chatInstanceIds[0];
      
      // If no specific responseIds are provided, get responses from all selected instances
      if (!selectedResponseIds || selectedResponseIds.length === 0) {
        let allResponses: string[] = [];
        for (const instanceId of chatInstanceIds) {
          const responses = await getChatResponsesByChatInstanceId(instanceId);
          if (responses && responses.length > 0) {
            const completedResponses = responses
              .filter((r) => r.status === 'completed')
              .map((r: { id: string }) => r.id);
            allResponses = [...allResponses, ...completedResponses];
          }
        }
        selectedResponseIds = allResponses;
      }
    } 
    // Handle single instance selection (original format)
    else if (chatIdToUse) {
      // If no specific responseIds are provided, include all completed responses for this instance
      if (!selectedResponseIds || selectedResponseIds.length === 0) {
        const responses = await getChatResponsesByChatInstanceId(chatIdToUse);
        if (responses) {
          selectedResponseIds = responses
            .filter((r) => r.status === 'completed')
            .map((r: { id: string }) => r.id);
        }
      }
    } 
    else {
      return NextResponse.json({ error: "Missing chatInstanceId or chatInstanceIds" }, { status: 400 });
    }

    if (!selectedResponseIds || selectedResponseIds.length === 0) {
      return NextResponse.json({ error: "No responses available for analysis" }, { status: 400 });
    }

    // Get chat instance to retrieve title
    const chatInstance = await getChatInstanceById(chatIdToUse);
    if (!chatInstance) {
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }

    // Extract title from conversation plan
    let title = "Analysis Session";
    try {
      if (chatInstance.conversationPlan) {
        const plan = typeof chatInstance.conversationPlan === 'string' 
          ? JSON.parse(chatInstance.conversationPlan) 
          : chatInstance.conversationPlan;
        if (plan && plan.title) {
          title = `Analysis: ${plan.title}`;
        }
      }
    } catch (error) {
      logger.error("Error parsing conversation plan", { error, chatInstanceId });
      // Continue with default title
    }

    // Create the internal chat session
    const session = await createInternalChatSession({
      userId,
      title,
      selectedResponses: selectedResponseIds,
    });

    logger.info("Internal chat session created", { 
      sessionId: session.id, 
      responseCount: selectedResponseIds.length 
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error creating internal chat session", { error: errorMessage });
    
    return NextResponse.json(
      { error: "Failed to create internal chat session", message: errorMessage },
      { status: 500 }
    );
  }
}