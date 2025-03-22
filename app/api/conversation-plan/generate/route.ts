import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { generateConversationPlanFromForm } from "@/ai_folder/create-actions";
import { getConversationPlan } from "@/db/queries/chat-instances-queries";

// Helper function to wait and verify plan existence
async function verifyPlanExists(chatId: string, maxAttempts = 3): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Wait between attempts
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, attempt)));
      }
      
      const plan = await getConversationPlan(chatId);
      if (plan) {
        logger.info('Plan verification successful', { chatId, attempt });
        return true;
      }
      
      logger.warn('Plan verification attempt failed', { chatId, attempt: attempt + 1, maxAttempts });
    } catch (error) {
      logger.error('Error during plan verification', {
        chatId, 
        attempt: attempt + 1,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return false;
}

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
    
    // Validate required fields
    if (!data.topic || !data.duration) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    logger.info('Generating conversation plan:', { 
      chatId, 
      userId,
      topicLength: data.topic.length
    });

    // Generate conversation plan
    const plan = await generateConversationPlanFromForm({
      userId,
      chatId,
      topic: data.topic,
      duration: data.duration,
      additionalDetails: data.additionalDetails
    });

    logger.info('Conversation plan generated successfully:', { 
      chatId,
      title: plan.title,
      objectiveCount: plan.objectives.length
    });
    
    // Verify that the plan was properly saved to the database
    const verified = await verifyPlanExists(chatId);
    if (!verified) {
      logger.warn('Generated plan may not be properly saved in the database', { chatId });
    }
    
    return NextResponse.json({
      ...plan,
      _verified: verified
    });
  } catch (error) {
    logger.error('Error generating conversation plan:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}