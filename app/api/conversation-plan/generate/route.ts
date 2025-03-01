import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { generateConversationPlanFromForm } from "@/ai_folder/create-actions";

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
    
    return NextResponse.json(plan);
  } catch (error) {
    logger.error('Error generating conversation plan:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}