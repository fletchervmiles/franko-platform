import { logger } from "@/lib/logger";
import { 
  updateAutomatedOnboardingStep,
  completeAutomatedOnboarding,
  failAutomatedOnboarding
} from "@/db/queries/user-onboarding-status-queries";
import { updateProfile } from "@/db/queries/profiles-queries";
import { createModal } from "@/db/queries/modals-queries";
import { createModalChatInstances } from "@/db/queries/modal-chat-instances-queries";
import { fetchBrandDetails } from "@/lib/brandfetch";
import { processOrganisationFromEmail } from "@/utils/email-utils";
import { agentsData } from "@/lib/agents-data";

export interface OnboardingConfig {
  xaAiEnabled: boolean;
  brandFetchEnabled: boolean;
  agentCount: number;
}

const DEFAULT_CONFIG: OnboardingConfig = {
  xaAiEnabled: !!process.env.XA_AI_API_KEY,
  brandFetchEnabled: !!process.env.BRANDFETCH_API_KEY,
  agentCount: 6
};

/**
 * Main function to run the complete automated onboarding process
 */
export async function runAutoOnboarding(
  userId: string, 
  companyUrl: string, 
  companyName: string,
  config: OnboardingConfig = DEFAULT_CONFIG
): Promise<void> {
  logger.info(`Starting automated onboarding for user ${userId}, company: ${companyName}`);
  
  try {
    // Step 1: XA.AI Company Research (if enabled)
    if (config.xaAiEnabled) {
      await performXaAiResearch(userId, companyUrl, companyName);
    } else {
      logger.info(`XA.AI research skipped for user ${userId} - API key not configured`);
      await performBasicCompanyInfo(userId, companyUrl, companyName);
    }
    await updateAutomatedOnboardingStep(userId, 'step1XaAiComplete');

    // Step 2: Generate Context Report
    await generateContextReport(userId, companyName);
    await updateAutomatedOnboardingStep(userId, 'step2ContextReportComplete');

    // Step 3: BrandFetch Integration (if enabled)
    let brandDetails: any = { primaryColor: "", secondaryColor: "" }; // Use empty strings for system defaults
    if (config.brandFetchEnabled) {
      const fetchedBranding = await fetchBrandDetails(companyUrl);
      if (fetchedBranding.logoUrl || fetchedBranding.primaryColor) {
        brandDetails = {
          primaryColor: fetchedBranding.primaryColor || "",
          secondaryColor: fetchedBranding.secondaryColor || "",
          logoUrl: fetchedBranding.logoUrl
        };
        await updateProfileBranding(userId, fetchedBranding);
      }
    }
    await updateAutomatedOnboardingStep(userId, 'step3BrandFetchComplete');

    // Step 4: Create Conversation Plans for Best Agents
    const selectedAgents = selectBestAgents(config.agentCount);
    const conversationPlans = await generateConversationPlans(userId, selectedAgents, companyName);
    await updateAutomatedOnboardingStep(userId, 'step4ConversationPlansComplete');

    // Step 5: Create Modal with Chat Instances
    const modalId = await createAutoModal(userId, companyName, selectedAgents, conversationPlans, brandDetails);
    await updateAutomatedOnboardingStep(userId, 'step5ModalCreated');

    // Mark as completed
    await completeAutomatedOnboarding(userId);

    logger.info(`Automated onboarding completed successfully for user ${userId}, modal created: ${modalId}`);

  } catch (error) {
    logger.error(`Automated onboarding failed for user ${userId}:`, error);
    await failAutomatedOnboarding(userId, `Process failed: ${error}`);
    throw error;
  }
}

/**
 * Step 1: Perform XA.AI company research
 */
async function performXaAiResearch(userId: string, companyUrl: string, companyName: string): Promise<void> {
  logger.info(`Starting XA.AI research for ${companyName}`);
  
  try {
    // TODO: Implement XA.AI API integration
    // For now, we'll use basic company info extraction
    await performBasicCompanyInfo(userId, companyUrl, companyName);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info(`XA.AI research completed for ${companyName}`);
  } catch (error) {
    logger.error(`XA.AI research failed for ${companyName}:`, error);
    // Fall back to basic company info
    await performBasicCompanyInfo(userId, companyUrl, companyName);
  }
}

/**
 * Basic company info extraction (fallback)
 */
async function performBasicCompanyInfo(userId: string, companyUrl: string, companyName: string): Promise<void> {
  try {
    const { organisationName, organisationUrl } = processOrganisationFromEmail(`user@${companyUrl.replace(/^https?:\/\//, '')}`);
    
    await updateProfile(userId, {
      organisationName: organisationName || companyName,
      organisationUrl: organisationUrl || companyUrl,
    });

    logger.info(`Basic company info updated for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to update basic company info for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Step 2: Generate context report
 */
async function generateContextReport(userId: string, companyName: string): Promise<void> {
  logger.info(`Generating context report for ${companyName}`);
  
  try {
    // Generate a basic context description
    const contextDescription = `We help ${companyName} better understand their customers through AI-powered conversation analysis. Our platform enables automated customer interviews that capture valuable insights about user needs, pain points, and opportunities for improvement.`;
    
    await updateProfile(userId, {
      organisationDescription: contextDescription,
      organisationDescriptionCompleted: true,
    });

    logger.info(`Context report generated for ${companyName}`);
  } catch (error) {
    logger.error(`Failed to generate context report for ${companyName}:`, error);
    throw error;
  }
}

/**
 * Step 3: Update profile with brand details
 */
async function updateProfileBranding(userId: string, brandDetails: any): Promise<void> {
  try {
    const updates: any = {};
    
    if (brandDetails.logoUrl) {
      updates.logoUrl = brandDetails.logoUrl;
    }
    if (brandDetails.primaryColor) {
      updates.buttonColor = brandDetails.primaryColor;
    }
    if (brandDetails.secondaryColor) {
      updates.titleColor = brandDetails.secondaryColor;
    }

    if (Object.keys(updates).length > 0) {
      await updateProfile(userId, updates);
      logger.info(`Profile branding updated for user ${userId}:`, updates);
    }
  } catch (error) {
    logger.error(`Failed to update profile branding for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Select the best agents for automated onboarding
 */
function selectBestAgents(count: number = 6): string[] {
  // Select the most valuable agents for new users
  const bestAgents = [
    'AGENT01', // Key Benefit
    'AGENT02', // Improvement/Friction  
    'AGENT04', // Persona & Use Case
    'AGENT05', // Pricing Check
    'AGENT08', // Open Feedback
    'AGENT09', // Disappointment Level (PMF)
  ];

  return bestAgents.slice(0, count);
}

/**
 * Step 4: Generate conversation plans for selected agents
 */
async function generateConversationPlans(userId: string, agentTypes: string[], companyName: string): Promise<Record<string, any>> {
  logger.info(`Generating conversation plans for ${agentTypes.length} agents`);
  
  const plans: Record<string, any> = {};
  
  try {
    for (const agentType of agentTypes) {
      const agentData = agentsData.find((agent: any) => agent.id === agentType);
      if (!agentData) {
        logger.warn(`Agent data not found for type: ${agentType}`);
        continue;
      }

      // Create a basic conversation plan
      const plan = {
        id: agentType,
        title: agentData.name,
        description: agentData.description,
        initialPrompt: agentData.prompt || `You are conducting a customer interview for ${companyName}. Focus on ${agentData.name.toLowerCase()}.`,
        objectives: [
          {
            id: "obj1",
            title: agentData.name,
            description: agentData.description,
            questions: [agentData.initialQuestion || "Tell me about your experience..."]
          }
        ],
        estimatedDuration: "10-15 minutes",
        agentPersonality: "professional and empathetic"
      };

      plans[agentType] = plan;
    }

    logger.info(`Generated ${Object.keys(plans).length} conversation plans`);
    return plans;
  } catch (error) {
    logger.error(`Failed to generate conversation plans:`, error);
    throw error;
  }
}

/**
 * Step 5: Create modal with chat instances
 */
async function createAutoModal(
  userId: string, 
  companyName: string, 
  agentTypes: string[],
  conversationPlans: Record<string, any>,
  brandDetails: any
): Promise<string> {
  logger.info(`Creating auto-modal for ${companyName} with ${agentTypes.length} agents`);
  
  try {
    // Generate unique embed slug
    const embedSlug = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`.substring(0, 50);
    
    // Create modal with brand settings
    const modal = await createModal({
      userId,
      name: `${companyName} Customer Feedback`,
      embedSlug,
              brandSettings: {
        displayName: `${companyName} Research`,
        instructions: `Help us improve ${companyName} by sharing your feedback`,
        theme: "light",
        primaryBrandColor: brandDetails.primaryColor || "",
        profilePictureUrl: brandDetails.logoUrl || null,
        chatIconText: "Give Feedback",
        userMessageColor: brandDetails.primaryColor || "",
        chatHeaderColor: brandDetails.secondaryColor || "",
        alignChatBubble: "right"
      },
      isActive: true
    });

    if (!modal) {
      throw new Error("Failed to create modal");
    }

    // Create chat instances for each agent
    const enabledAgents = agentTypes.map(agentType => ({
      agentType,
      conversationPlan: conversationPlans[agentType]
    }));

    await createModalChatInstances(modal.id, userId, enabledAgents);

    logger.info(`Modal created successfully: ${modal.id} with slug: ${embedSlug}`);
    return modal.id;
  } catch (error) {
    logger.error(`Failed to create auto-modal:`, error);
    throw error;
  }
} 