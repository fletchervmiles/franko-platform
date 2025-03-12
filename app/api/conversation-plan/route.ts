import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getConversationPlan, updateChatInstanceConversationPlan } from "@/db/queries/chat-instances-queries";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    logger.info('GET conversation-plan request received');
    
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized access attempt to conversation-plan');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      logger.warn('Missing chatId in conversation-plan request');
      return new NextResponse("Missing chatId", { status: 400 });
    }

    logger.info('Fetching conversation plan', { userId, chatId });
    
    try {
      const plan = await getConversationPlan(chatId);
      
      if (!plan) {
        logger.warn('No conversation plan found', { chatId });
        return new NextResponse("Conversation plan not found", { status: 404 });
      }
      
      // Check plan structure to ensure it's valid
      logger.info('Conversation plan retrieved successfully', { 
        chatId,
        hasTitle: Boolean(plan.title), 
        hasDuration: Boolean(plan.duration),
        hasSummary: Boolean(plan.summary),
        objectiveCount: plan.objectives?.length || 0 
      });
      
      return NextResponse.json(plan);
    } catch (planError) {
      logger.error('Error retrieving conversation plan', {
        chatId,
        errorType: planError instanceof Error ? planError.name : 'Unknown',
        errorMessage: planError instanceof Error ? planError.message : String(planError),
        errorStack: planError instanceof Error ? planError.stack : undefined
      });
      
      return new NextResponse(`Error retrieving conversation plan: ${planError instanceof Error ? planError.message : 'Unknown error'}`, { status: 500 });
    }
  } catch (error) {
    logger.error('Unhandled error in conversation-plan GET endpoint', {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return new NextResponse("Missing chatId", { status: 400 });
    }

    const data = await request.json();
    const updatedPlan = await updateChatInstanceConversationPlan(chatId, data);
    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating conversation plan:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 