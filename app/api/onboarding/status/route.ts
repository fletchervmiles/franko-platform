import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getOnboardingStatus } from "@/db/queries/user-onboarding-status-queries";

// Configure Vercel serverless function timeout (Pro plan allows longer timeouts)
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startTime = Date.now();
  logger.info('GET request to /api/onboarding/status received');

  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/onboarding/status');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    logger.info(`Fetching onboarding status for user: ${userId}`);
    
    const status = await getOnboardingStatus(userId);

    if (!status) {
      // getOnboardingStatus handles creation, so null means an error occurred during fetch/creation
      logger.error(`Failed to get or create onboarding status for user: ${userId}`);
      return new NextResponse(JSON.stringify({ error: "Failed to retrieve onboarding status" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const duration = Date.now() - startTime;
    logger.info(`Successfully fetched onboarding status for user ${userId} in ${duration}ms`);
    
    return NextResponse.json(status);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error fetching onboarding status: ${error}`, { durationMs: duration });
    
    // Generic error for security
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 