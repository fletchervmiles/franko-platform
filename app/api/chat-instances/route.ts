import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getChatInstancesByUserId } from "@/db/queries/chat-instances-queries";
import { getChatResponsesByChatInstanceId } from "@/db/queries/chat-responses-queries";
import { numberedObjectivesToArray } from "@/components/conversationPlanSchema";

export async function GET() {
  try {
    console.log("[chat-instances] Starting GET request");
    
    const { userId } = await auth();
    console.log("[chat-instances] Auth check completed, userId exists:", !!userId);
    
    if (!userId) {
      console.log("[chat-instances] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chat instances for the user
    console.log("[chat-instances] Fetching chat instances for userId:", userId);
    const chatInstances = await getChatInstancesByUserId(userId);
    console.log("[chat-instances] Found chat instances count:", chatInstances?.length ?? 0);

    // Process each chat instance to extract and add required information
    console.log("[chat-instances] Starting to process chat instances");
    const workspaces = await Promise.all(
      chatInstances.map(async (instance) => {
        try {
          console.log(`[chat-instances] Processing instance ${instance.id}`);
          // Get responses for this chat instance
          const responses = await getChatResponsesByChatInstanceId(instance.id);
          console.log(`[chat-instances] Found ${responses.length} responses for instance ${instance.id}`);
          
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
        } catch (instanceError) {
          console.error(`[chat-instances] Error processing instance ${instance.id}:`, instanceError);
          console.error("[chat-instances] Instance data:", JSON.stringify(instance, null, 2));
          throw instanceError; // Re-throw to be caught by outer catch
        }
      })
    );

    console.log("[chat-instances] Successfully processed all instances");
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("[chat-instances] Critical error in GET handler:", error);
    if (error instanceof Error) {
      console.error("[chat-instances] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("[chat-instances] Non-Error object thrown:", error);
    }
    return NextResponse.json({ 
      error: "Failed to fetch chat instances",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}