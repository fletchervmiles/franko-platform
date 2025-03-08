import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getChatInstancesByUserId } from "@/db/queries/chat-instances-queries";
import { getChatResponsesByChatInstanceId } from "@/db/queries/chat-responses-queries";
import { numberedObjectivesToArray } from "@/components/conversationPlanSchema";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chat instances for the user
    const chatInstances = await getChatInstancesByUserId(userId);

    // Process each chat instance to extract and add required information
    const workspaces = await Promise.all(
      chatInstances.map(async (instance) => {
        // Get responses for this chat instance
        const responses = await getChatResponsesByChatInstanceId(instance.id);
        
        // Extract title from conversation plan
        let title = "Untitled Conversation";
        if (instance.conversationPlan) {
          const plan = instance.conversationPlan as any;
          title = plan.title || title;
        }

        // Calculate status based on lastViewed timestamp
        let status: "new responses" | "reviewed" = "reviewed";
        
        if (responses.length > 0) {
          // If there's no lastViewed timestamp, or if there are responses created after lastViewed
          if (!instance.lastViewed) {
            status = "new responses";
          } else {
            const lastViewedDate = new Date(instance.lastViewed);
            
            // Check if any responses were created after the lastViewed timestamp
            const hasNewResponses = responses.some(response => {
              const responseDate = new Date(response.createdAt);
              return responseDate > lastViewedDate;
            });
            
            if (hasNewResponses) {
              status = "new responses";
            }
          }
        }

        // Format the date - use updatedAt to track when the instance was last modified
        const lastEdited = instance.updatedAt 
          ? new Date(instance.updatedAt).toISOString().split('T')[0]
          : new Date(instance.createdAt).toISOString().split('T')[0];

        // Filter to only include completed responses (like in the [id]/responses route)
        const completedResponses = responses.filter(
          response => response.status === 'completed'
        );
        
        // Calculate total user words from completed responses
        const customerWords = completedResponses.reduce((sum, response) => {
          // Convert to number if stored as string, default to 0 if undefined
          const userWords = response.user_words ? 
            (typeof response.user_words === 'string' ? parseInt(response.user_words, 10) : response.user_words) : 0;
          return sum + (isNaN(userWords) ? 0 : userWords);
        }, 0);

        return {
          id: instance.id,
          guideName: title,
          status,
          lastEdited,
          responses: completedResponses.length, // Only show completed responses count
          customerWords,
        };
      })
    );

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching chat instances:", error);
    return NextResponse.json({ error: "Failed to fetch chat instances" }, { status: 500 });
  }
}