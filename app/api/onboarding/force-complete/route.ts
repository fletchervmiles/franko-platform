import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { forceCompleteOnboarding } from "@/db/queries/user-onboarding-status-queries";

// Configure Vercel serverless function timeout (Pro plan allows longer timeouts)
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.info('POST request to /api/onboarding/force-complete received');

  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/onboarding/force-complete');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    logger.info(`Attempting to force-complete onboarding for user: ${userId}`);

    const updatedStatus = await forceCompleteOnboarding(userId);

    if (!updatedStatus) {
      logger.error(`Failed to force-complete onboarding for user: ${userId}`);
      // This could happen if the underlying getOnboardingStatus or the update failed
      return new NextResponse(JSON.stringify({ error: "Failed to force-complete onboarding status" }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Successfully force-completed onboarding for user ${userId}. Duration: ${duration}ms`);

    // Return success and the final (now completed) status
    return NextResponse.json({ success: true, status: updatedStatus });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error processing /api/onboarding/force-complete: ${error}`, { durationMs: duration });
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
} 