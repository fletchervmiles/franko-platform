import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { generateContextForUser } from "@/lib/context-generation";
import { getOnboardingStatus, startAutomatedOnboarding, failAutomatedOnboarding } from "@/db/queries/user-onboarding-status-queries";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for context generation

// Blocked personal email domains
const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'icloud.com', 'aol.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'yandex.com', 'zoho.com'
];

// Demo/example domains that skip onboarding
const DEMO_DOMAINS = [
  'example.com'
];

/**
 * Extract company domain and name from email
 */
function extractCompanyInfo(email: string): { domain: string; companyName: string } | null {
  const emailParts = email.split('@');
  if (emailParts.length !== 2) return null;
  
  const domain = emailParts[1].toLowerCase();
  
  // Check if domain is blocked
  if (BLOCKED_DOMAINS.includes(domain)) {
    return null;
  }
  
  // Extract company name from domain (remove TLD)
  const domainParts = domain.split('.');
  const companyName = domainParts[0]
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  return { domain: `https://${domain}`, companyName };
}

/**
 * Check if email domain should skip onboarding
 */
function shouldSkipOnboarding(email: string): boolean {
  const emailParts = email.split('@');
  if (emailParts.length !== 2) return false;
  
  const domain = emailParts[1].toLowerCase();
  return DEMO_DOMAINS.includes(domain);
}

export async function POST(request: Request) {
  const startTime = Date.now();
  logger.info('POST request to /api/onboarding/auto-start received');

  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized access attempt to /api/onboarding/auto-start');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's email from request body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        shouldFallback: true 
      }, { status: 400 });
    }

    // Check if this is a demo account that should skip onboarding
    if (shouldSkipOnboarding(email)) {
      logger.info(`Demo account detected for user ${userId} (${email}), skipping onboarding`);
      return NextResponse.json({ 
        skipped: true, 
        reason: "demo_account",
        redirectTo: "/workspace" 
      });
    }

    // IDEMPOTENCY CHECK 1: Check if automation is already in progress
    const onboardingStatus = await getOnboardingStatus(userId);
    if (onboardingStatus?.processingStatus === 'in_progress') {
      logger.info(`Automation already in progress for user ${userId}, returning existing process`);
      return NextResponse.json({ 
        success: true,
        message: "Automation already in progress",
        alreadyStarted: true
      });
    }

    // IDEMPOTENCY CHECK 2: Check if user already has context (skip automation)
    const profile = await getProfileByUserId(userId);
    if (profile?.organisationDescription) {
      logger.info(`User ${userId} already has context, skipping automation`);
      return NextResponse.json({ 
        skipped: true, 
        reason: "existing_context",
        redirectTo: "/workspace" 
      });
    }

    // Extract company info from email
    const companyInfo = extractCompanyInfo(email);
    if (!companyInfo) {
      logger.info(`Personal email detected for user ${userId}, falling back to manual`);
      return NextResponse.json({ 
        error: "Personal email domain detected",
        shouldFallback: true,
        fallbackUrl: "/context-setup"
      }, { status: 400 });
    }

    // IDEMPOTENCY CHECK 3: Atomically mark automation as started
    const automationStarted = await startAutomatedOnboarding(userId);
    if (!automationStarted) {
      logger.error(`Failed to start automation tracking for user ${userId}`);
      return NextResponse.json({ 
        error: "Failed to initialize automation",
        shouldFallback: true 
      }, { status: 500 });
    }

    // Start auto-onboarding in background
    processAutoOnboarding(userId, companyInfo.domain, companyInfo.companyName)
      .catch(error => {
        logger.error(`Background auto-onboarding failed for user ${userId}:`, error);
        // Mark automation as failed
        failAutomatedOnboarding(userId, error.message || 'Unknown error')
          .catch(failError => {
            logger.error(`Failed to mark automation as failed for user ${userId}:`, failError);
          });
      });

    const duration = Date.now() - startTime;
    logger.info(`Auto-onboarding started for user ${userId}. Duration: ${duration}ms`);

    return NextResponse.json({ 
      success: true,
      message: "Auto-onboarding started",
      companyName: companyInfo.companyName
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error in /api/onboarding/auto-start:`, error);
    return NextResponse.json({ 
      error: "Internal server error",
      shouldFallback: true 
    }, { status: 500 });
  }
}

async function processAutoOnboarding(userId: string, companyUrl: string, companyName: string) {
  try {
    logger.info(`Starting background auto-onboarding for user ${userId}`);
    
    await generateContextForUser(userId, companyUrl, companyName);
    
    logger.info(`✅ Auto-onboarding completed for user ${userId}`);

  } catch (error) {
    logger.error(`Auto-onboarding error for user ${userId}:`, error);
    // Mark automation as failed
    await failAutomatedOnboarding(userId, error instanceof Error ? error.message : 'Unknown error');
  }
} 