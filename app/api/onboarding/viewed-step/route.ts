import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { updateOnboardingStep } from "@/db/queries/user-onboarding-status-queries";
import { type SelectUserOnboardingStatus } from "@/db/schema";

// Define the type for the expected request body
interface ViewedStepRequestBody {
  step: keyof Pick<SelectUserOnboardingStatus, 'step3PersonasReviewed' | 'step5LinkShared'>;
}

// Define the valid keys explicitly for stricter validation
const validStepKeys: Array<keyof Pick<SelectUserOnboardingStatus, 'step3PersonasReviewed' | 'step5LinkShared'>> = [
  'step3PersonasReviewed',
  'step5LinkShared'
];

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.info('POST request to /api/onboarding/viewed-step received');

  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/onboarding/viewed-step');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let body: ViewedStepRequestBody;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn('Invalid JSON body received for /api/onboarding/viewed-step', { error: parseError });
      return new NextResponse(JSON.stringify({ error: "Invalid request body" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { step } = body;

    // Validate the step key
    if (!step || !validStepKeys.includes(step)) {
      logger.warn(`Invalid or missing step key received: ${step} for user: ${userId}`);
      return new NextResponse(JSON.stringify({ error: "Invalid or missing step key" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    logger.info(`Attempting to update onboarding step: ${step} for user: ${userId}`);

    const updatedStatus = await updateOnboardingStep(userId, step);

    if (!updatedStatus) {
      logger.error(`Failed to update onboarding step ${step} for user: ${userId}`);
      // This could happen if the initial status couldn't be fetched/created in updateOnboardingStep
      return new NextResponse(JSON.stringify({ error: "Failed to update onboarding step" }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Check if the specific step was actually updated (it might have been true already)
    const wasUpdated = updatedStatus[step] === true; 
    const message = wasUpdated ? "Step updated successfully" : "Step was already marked as complete";
    const duration = Date.now() - startTime;
    logger.info(`Onboarding step update finished for ${step}, user ${userId}. Status: ${message}. Duration: ${duration}ms`);

    return NextResponse.json({ success: true, message: message, status: updatedStatus });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error processing /api/onboarding/viewed-step: ${error}`, { durationMs: duration });
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
} 