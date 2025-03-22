import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { generateConversationPlanFromForm } from "@/ai_folder/create-actions";
import { getConversationPlan } from "@/db/queries/chat-instances-queries";

// Helper function to wait and verify plan existence
async function verifyPlanExists(chatId: string, maxAttempts = 10): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Wait between attempts - increase delay significantly
      if (attempt > 0) {
        const delay = 1000 * Math.pow(2, Math.min(attempt, 5)); // Max ~32 seconds
        logger.info(`Waiting ${delay}ms before verification attempt ${attempt + 1}`, { chatId });
        await new Promise(resolve => setTimeout(resolve, delay));
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
  const startTime = Date.now();
  let aiStartTime, aiEndTime, verificationStartTime, verificationEndTime;

  try {
    logger.info('POST request to generate conversation plan started', { timestamp: startTime });
    
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
      topicLength: data.topic.length,
      setupTimeMs: Date.now() - startTime
    });

    // Start timing the AI request
    aiStartTime = Date.now();
    logger.info('AI model request starting', { 
      chatId, 
      timestamp: aiStartTime,
      elapsedMs: aiStartTime - startTime 
    });

    // Generate conversation plan
    const plan = await generateConversationPlanFromForm({
      userId,
      chatId,
      topic: data.topic,
      duration: data.duration,
      additionalDetails: data.additionalDetails
    });

    // End timing the AI request
    aiEndTime = Date.now();
    const aiDuration = aiEndTime - aiStartTime;
    
    logger.info('AI model request completed', { 
      chatId,
      aiDurationMs: aiDuration,
      totalElapsedMs: aiEndTime - startTime,
      title: plan.title,
      objectiveCount: plan.objectives.length
    });
    
    // Start timing the verification process
    verificationStartTime = Date.now();
    logger.info('Starting plan verification process', { 
      chatId, 
      timestamp: verificationStartTime,
      elapsedSoFarMs: verificationStartTime - startTime 
    });
    
    // Verify that the plan was properly saved to the database with increased attempts
    const verified = await verifyPlanExists(chatId);
    
    // End timing the verification process
    verificationEndTime = Date.now();
    const verificationDuration = verificationEndTime - verificationStartTime;
    
    logger.info('Plan verification process completed', {
      chatId,
      verificationDurationMs: verificationDuration,
      verified,
      totalElapsedMs: verificationEndTime - startTime
    });
    
    if (!verified) {
      logger.warn('Could not verify plan was saved to database after multiple attempts', { 
        chatId,
        aiDurationMs: aiDuration,
        verificationDurationMs: verificationDuration,
        totalElapsedMs: Date.now() - startTime
      });
      
      // Don't fail the request, but inform the client it will need to retry
      return NextResponse.json({
        ...plan,
        _verified: false,
        _message: "Plan generation completed but verification failed. Client should delay before fetching.",
        _timing: {
          aiMs: aiDuration,
          verificationMs: verificationDuration,
          totalMs: Date.now() - startTime
        }
      });
    }
    
    // Plan has been verified to exist in the database
    logger.info('Plan successfully verified in database', { 
      chatId,
      aiDurationMs: aiDuration,
      verificationDurationMs: verificationDuration,
      totalElapsedMs: Date.now() - startTime
    });
    
    return NextResponse.json({
      ...plan,
      _verified: true,
      _timing: {
        aiMs: aiDuration,
        verificationMs: verificationDuration,
        totalMs: Date.now() - startTime
      }
    });
  } catch (error) {
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // Calculate all available timing metrics
    const timingInfo = {
      totalMs: totalDuration,
      setupMs: aiStartTime ? (aiStartTime - startTime) : undefined,
      aiMs: aiStartTime && aiEndTime ? (aiEndTime - aiStartTime) : undefined,
      verificationMs: verificationStartTime && verificationEndTime ? (verificationEndTime - verificationStartTime) : undefined,
      errorAtMs: endTime - startTime
    };
    
    logger.error('Error generating conversation plan:', {
      error,
      timing: timingInfo
    });
    
    return new NextResponse(JSON.stringify({
      error: "Internal server error",
      _timing: timingInfo
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}