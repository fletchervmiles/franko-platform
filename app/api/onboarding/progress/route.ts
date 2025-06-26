import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOnboardingStatus } from "@/db/queries/user-onboarding-status-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { getModalsByUserId } from "@/db/queries/modals-queries";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [status, profile, modals] = await Promise.all([
      getOnboardingStatus(userId),
      getProfileByUserId(userId),
      getModalsByUserId(userId)
    ]);

    // Check individual completion status
    const isResearchComplete = status?.step1XaAiComplete || false; // XA.AI research done
    const isContextReportComplete = status?.step2ContextReportComplete || false; // Context description generated
    const isBrandingComplete = status?.step3BrandFetchComplete || false; // Branding extraction done
    const isConversationPlansComplete = status?.step4ConversationPlansComplete || false; // Conversation plans created
    const isModalComplete = status?.step5ModalCreated || false; // Modal created
    const hasContextDescription = !!profile?.organisationDescription;
    const hasBrandingData = !!(profile?.logoUrl || profile?.buttonColor);

    const firstModalId = modals.length > 0 ? modals[0].id : null;

    // Enhanced progress calculation with separated steps
    let progress = 0;
    let message = "Starting setup...";
    
    if (isResearchComplete && isContextReportComplete && isBrandingComplete && isConversationPlansComplete && isModalComplete) {
      progress = 100;
      message = "Setup complete!";
    } else if (isResearchComplete && isContextReportComplete && isBrandingComplete && isConversationPlansComplete) {
      progress = 85;
      message = "Creating your feedback modal with 6 agents...";
    } else if (isResearchComplete && isContextReportComplete && isBrandingComplete) {
      progress = 70;
      message = "Generating conversation plans for your agents...";
    } else if (isResearchComplete && isContextReportComplete) {
      progress = 50;
      message = "Retrieving your brand assets for your modal...";
    } else if (isResearchComplete) {
      progress = 30;
      message = "Writing a context-rich report for your agents...";
    } else if (profile?.organisationUrl) {
      progress = 15;
      message = "Researching your company...";
    } else {
      progress = 10;
      message = "Starting company research...";
    }

    return NextResponse.json({
      isComplete: isResearchComplete && isContextReportComplete && isBrandingComplete && isConversationPlansComplete && isModalComplete,
      progress,
      message,
      shouldRedirect: (isResearchComplete && isContextReportComplete && isBrandingComplete && isConversationPlansComplete && isModalComplete && firstModalId) ? `/workspace?modalId=${firstModalId}&tab=playground` : null
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 