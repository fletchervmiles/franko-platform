/**
 * API Route for fetching chat instances that have response data
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getChatInstancesWithResponses } from "@/db/queries/chat-instances-queries";

export async function GET() {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chat instances with response counts
    const instances = await getChatInstancesWithResponses(userId);

    // Transform data for client
    const conversations = instances.map(instance => {
      // Get title from topic or conversation plan
      let title = instance.topic || "Untitled Conversation";
      
      // If no topic, try to get title from conversation plan
      if (!title && instance.conversationPlan) {
        try {
          const plan = typeof instance.conversationPlan === 'string' 
            ? JSON.parse(instance.conversationPlan)
            : instance.conversationPlan;
            
          if (plan && plan.title) {
            title = plan.title;
          }
        } catch (error) {
          // Use default title if parsing fails
        }
      }

      return {
        id: instance.id,
        title,
        responseCount: instance.responseCount || 0,
        wordCount: instance.totalWords || 0
      };
    });

    // Return formatted data
    return NextResponse.json({
      conversations
    });
  } catch (error) {
    logger.error("Error fetching chat instances with responses", { error });
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}