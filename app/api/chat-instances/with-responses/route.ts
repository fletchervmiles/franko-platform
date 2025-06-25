/**
 * API Route for fetching chat instances that have response data
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getChatInstancesWithResponses } from "@/db/queries/chat-instances-queries";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      logger.info("Unauthorized access attempt to chat-instances/with-responses");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("Fetching chat instances with responses", { userId });

    // Get chat instances with response counts
    const instances = await getChatInstancesWithResponses(userId);
    
    logger.info(`Retrieved ${instances.length} chat instances with responses`);

    // Transform data for client
    const conversations = instances.map(instance => {
      // Try to get title from conversation plan first for consistency
      let title = "Untitled Conversation";
      
      if (instance.conversationPlan) {
        try {
          const plan = typeof instance.conversationPlan === 'string' 
            ? JSON.parse(instance.conversationPlan)
            : instance.conversationPlan;
            
          if (plan && plan.title) {
            title = plan.title;
          }
        } catch (error) {
          // Use topic as fallback if parsing fails
          title = instance.topic || title;
          logger.info("Error parsing conversation plan", { 
            instanceId: instance.id, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      } else {
        // Use topic if no plan exists
        title = instance.topic || title;
      }

      return {
        id: instance.id,
        title,
        responseCount: instance.responseCount || 0,
        wordCount: instance.totalWords || 0
      };
    });

    // Return formatted data
    logger.info(`Returning ${conversations.length} formatted conversations`);
    return NextResponse.json({
      conversations
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error("Error fetching chat instances with responses", { 
      error: errorMessage,
      stack: errorStack
    });
    
    console.error("API Error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch conversations", details: errorMessage },
      { status: 500 }
    );
  }
}