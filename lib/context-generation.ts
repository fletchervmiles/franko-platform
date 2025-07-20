import Exa from "exa-js";
import { updateProfile } from "@/db/queries/profiles-queries";
import { gemini25FlashPreviewModel } from "@/ai_folder";
import { generateText } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { updateOnboardingStep, completeAutomatedOnboarding } from '@/db/queries/user-onboarding-status-queries';
import { fetchBrandDetails } from "@/lib/brandfetch";
import { createAutomatedModal } from "@/ai_folder/create-plans";
import fs from 'fs';
import path from 'path';
// import { google } from "@ai-sdk/google"; // No longer needed since we use wrapped model

// EXACT same schemas from /api/context/route.ts
const inputSignalSchema = z.object({
  customerRoles: z.array(z.object({
    title: z.string(),
    evidence: z.string()
  })).default([]),
  featureMenu: z.array(z.object({
    name: z.string(),
    alias: z.string()
  })).default([]),
  customerBenefitClaims: z.array(z.string()).default([])
});

// EXACT same helper functions from /api/context/route.ts
function loadContextSetterPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'context_setter.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading context setter prompt:', error);
    throw new Error('Failed to load context setter prompt');
  }
}

function loadInputSignalPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'input_signal.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading input signal prompt:', error);
    throw new Error('Failed to load input signal prompt');
  }
}

async function retryExaRequest(fn: () => Promise<any>, maxAttempts = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * CORE CONTEXT GENERATION FUNCTION
 * Extracted from /api/context/route.ts - performs EXACT same process
 * (excluding persona generation which is being removed)
 */
export async function generateContextForUser(
  userId: string,
  organisationUrl: string,
  organisationName: string
): Promise<{ success: boolean; description?: string; brandingUpdated?: boolean; modalCreated?: boolean; modalId?: string; error?: string }> {
  
  logger.info(`Starting automated context generation for user ${userId}`, { 
    organisationUrl, 
    organisationName 
  });

  try {
    // Step 1: Update profile with initial data (EXACT same as manual)
    logger.info('Updating profile with initial data:', { organisationUrl, organisationName });
    const initialUpdate = await updateProfile(userId, {
      organisationUrl,
      organisationName,
    });
    logger.info('Initial profile update successful');

    // Non-blocking context update counter increment (same as manual)
    Promise.resolve().then(async () => {
      try {
        const profile = await updateProfile(userId, {});
        if (profile && profile[0]) {
          const currentCount = profile[0].context_update || 0;
          await updateProfile(userId, {
            context_update: currentCount + 1
          });
          logger.debug('Updated context update count:', { 
            userId, 
            newCount: currentCount + 1 
          });
        }
      } catch (error) {
        logger.error('Failed to update context update count:', error);
        // Don't throw - this is non-blocking
      }
    });

    // Step 2: Run all 11 Exa requests (EXACT same as manual)
    const exa = new Exa(process.env.EXA_API_KEY!);
    const timeout = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    logger.info('Starting 11 concurrent Exa requests (same as manual)...');

    const exaResults = await Promise.allSettled([
      // EXACT same 11 requests as /api/context/route.ts lines 200-333
      retryExaRequest(async () => {
        logger.info('Making Exa request 1 (same as manual):', { 
          url: organisationUrl,
          timestamp: new Date().toISOString()
        });
        const result = await exa.getContents(
          [organisationUrl],
          {
            text: { maxCharacters: 4000 },
            livecrawl: "always",
            subpages: 10
          }
        );
        logger.info('Exa request 1 response:', { 
          resultLength: JSON.stringify(result).length,
          timestamp: new Date().toISOString()
        });
        return result;
      }),
      
      (async () => {
        const query = `Here is a comprehensive overview of ${organisationName} (${organisationUrl}), covering their company background, products, services, mission, industry, target market, and unique value proposition:`;
        logger.info('Making Exa request 2 (same as manual):', { 
          query,
          timestamp: new Date().toISOString()
        });
        const result = await exa.searchAndContents(query, {
          text: { maxCharacters: 4000 },
          type: "auto"
        });
        logger.info('Exa request 2 response:', { 
          resultLength: JSON.stringify(result).length,
          timestamp: new Date().toISOString()
        });
        return result;
      })(),
      
      (async () => {
        const query = `Here's what people are saying about ${organisationName} (${organisationUrl}), including customer opinions, online discussions, forums, user feedback, testimonials, and ratings:`;
        logger.info('Making Exa request 3 (same as manual):', { 
          query,
          timestamp: new Date().toISOString()
        });
        const result = await exa.searchAndContents(query, {
          text: { maxCharacters: 4000 },
          type: "auto"
        });
        logger.info('Exa request 3 response:', { 
          resultLength: JSON.stringify(result).length,
          timestamp: new Date().toISOString()
        });
        return result;
      })(),
      
      // Extract 04-11 (EXACT same as manual)
      exa.searchAndContents(`site:${organisationUrl} case study ${organisationName}`, {
        type: "keyword",
        text: { maxCharacters: 4000 }
      }),
      
      exa.searchAndContents(`"${organisationName}" review`, {
        type: "neural",
        text: { maxCharacters: 3000 }
      }),
      
      exa.searchAndContents(`Reddit "${organisationName}"`, {
        type: "keyword",
        text: { maxCharacters: 2500 }
      }),
      
      exa.getContents([organisationUrl], {
        subpages: 8,
        subpage_target: ["docs", "integration", "quickstart"],
        text: { maxCharacters: 3000 }
      }),
      
      exa.searchAndContents(`${organisationName} webinar OR YouTube talk`, {
        type: "neural",
        text: { maxCharacters: 3000 }
      }),
      
      exa.getContents([organisationUrl], {
        subpages: 6,
        subpage_target: ["release", "changelog", "blog"],
        text: { maxCharacters: 2500 }
      }),
      
      exa.searchAndContents(`"${organisationName}" "case study pdf"`, {
        type: "keyword",
        text: { maxCharacters: 3500 }
      }),
      
      exa.searchAndContents(`"${organisationName}" pricing plans`, {
        type: "keyword",
        text: { maxCharacters: 2000 }
      })
    ]);

    clearTimeout(timeoutId);
    logger.info('All 11 Exa requests completed (same as manual)');

    // Mark Exa research as complete (Step 2.1)
    await updateOnboardingStep(userId, 'step1ContextComplete'); // Use this to track research completion

    // Extract results (EXACT same mapping as manual)
    const [
      extract01Result, extract02Result, extract03Result,
      extract04Res, extract05Res, extract06Res,
      extract07Res, extract08Res, extract09Res,
      extract10Res, extract11Res
    ] = exaResults;
    
    const extract01 = extract01Result.status === 'fulfilled' ? extract01Result.value : null;
    const extract02 = extract02Result.status === 'fulfilled' ? extract02Result.value : null;
    const extract03 = extract03Result.status === 'fulfilled' ? extract03Result.value : null;
    const extract04 = extract04Res.status === 'fulfilled' ? extract04Res.value : null;
    const extract05 = extract05Res.status === 'fulfilled' ? extract05Res.value : null;
    const extract06 = extract06Res.status === 'fulfilled' ? extract06Res.value : null;
    const extract07 = extract07Res.status === 'fulfilled' ? extract07Res.value : null;
    const extract08 = extract08Res.status === 'fulfilled' ? extract08Res.value : null;
    const extract09 = extract09Res.status === 'fulfilled' ? extract09Res.value : null;
    const extract10 = extract10Res.status === 'fulfilled' ? extract10Res.value : null;
    const extract11 = extract11Res.status === 'fulfilled' ? extract11Res.value : null;

    // Log any failures but continue processing (same as manual)
    exaResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Exa request ${index + 1} failed:`, {
          error: result.reason,
          timestamp: new Date().toISOString()
        });
      }
    });

    // If all requests failed, then error out (same as manual)
    if (!extract01 && !extract02 && !extract03 && !extract04 && !extract05 && !extract06 && !extract07 && !extract08 && !extract09 && !extract10 && !extract11) {
      throw new Error("All Exa requests failed");
    }

    // Step 3: Generate Input Signal (EXACT same as manual)
    let rawInputSignalString = "";
    const maxInputSignalRetries = 3;
    
    logger.info('Starting Input Signal generation (same as manual)...');
    try {
      const inputSignalPromptTemplate = loadInputSignalPrompt();
      const filledInputSignalPrompt = inputSignalPromptTemplate
        .replace(/{organisation_name}/g, organisationName)
        .replace(/{organisation_url}/g, organisationUrl)
        .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
        .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
        .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2))
        .replace('{extract04}', JSON.stringify(extract04 || {}, null, 2))
        .replace('{extract05}', JSON.stringify(extract05 || {}, null, 2))
        .replace('{extract06}', JSON.stringify(extract06 || {}, null, 2))
        .replace('{extract07}', JSON.stringify(extract07 || {}, null, 2))
        .replace('{extract08}', JSON.stringify(extract08 || {}, null, 2))
        .replace('{extract09}', JSON.stringify(extract09 || {}, null, 2))
        .replace('{extract10}', JSON.stringify(extract10 || {}, null, 2))
        .replace('{extract11}', JSON.stringify(extract11 || {}, null, 2));

      for (let attempt = 1; attempt <= maxInputSignalRetries; attempt++) {
        try {
          logger.info(`Input Signal attempt ${attempt}/${maxInputSignalRetries}`);
          const { text } = await generateText({
            model: gemini25FlashPreviewModel, 
            prompt: filledInputSignalPrompt,
            providerOptions: {
              google: { thinkingConfig: { thinkingBudget: 200 } } 
            } 
          });
          
          rawInputSignalString = text; // Store the raw text output
          logger.info('Input Signal generation successful (same as manual). Length:', rawInputSignalString.length);
          break; // Success, exit retry loop

        } catch (error: any) {
          logger.error(`Input Signal attempt ${attempt} failed:`, { 
            error: error?.message, 
            finishReason: error?.finishReason, 
            usage: error?.usage 
          });
          if (attempt === maxInputSignalRetries) {
            logger.error('Failed to generate Input Signal text after multiple attempts. Using default empty string.');
            rawInputSignalString = ""; // Ensure empty string on final failure
          } else {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000)); 
          }
        }
      }
    } catch (promptLoadingError) {
      logger.error('Failed to load or prepare input signal prompt:', promptLoadingError);
      rawInputSignalString = "";
    }

    // Step 4: Generate Final Description (EXACT same as manual)
    let description: string | undefined;
    const maxContextSetterRetries = 3;
    
    logger.info('Starting Context Setter generation (same as manual)...');
    try {
      const contextSetterPromptTemplate = loadContextSetterPrompt();
      const filledContextSetterPrompt = contextSetterPromptTemplate
        .replace(/{organisation_name}/g, organisationName)
        .replace(/{organisation_url}/g, organisationUrl)
        .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
        .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
        .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2))
        .replace('{extract04}', JSON.stringify(extract04 || {}, null, 2))
        .replace('{extract05}', JSON.stringify(extract05 || {}, null, 2))
        .replace('{extract06}', JSON.stringify(extract06 || {}, null, 2))
        .replace('{extract07}', JSON.stringify(extract07 || {}, null, 2))
        .replace('{extract08}', JSON.stringify(extract08 || {}, null, 2))
        .replace('{extract09}', JSON.stringify(extract09 || {}, null, 2))
        .replace('{extract10}', JSON.stringify(extract10 || {}, null, 2))
        .replace('{extract11}', JSON.stringify(extract11 || {}, null, 2))
        .replace('{input_signal_string}', rawInputSignalString);

      try {
        const attempt = 1; // Initialize attempt counter
        logger.info(`Context Setter attempt ${attempt}/${maxContextSetterRetries}`);
        const { text } = await generateText({
          prompt: filledContextSetterPrompt,
          model: gemini25FlashPreviewModel, 
          providerOptions: { 
            google: { 
              thinkingConfig: { thinkingBudget: 200 } 
            } 
          } as any 
        });
        description = text || "";
        if (!description.trim()) throw new Error("Generated description was empty");
        logger.info('Context Setter generation successful (same as manual). Description sample:', 
                    description.substring(0, 200) + '...');
      } catch (error: any) {
        logger.error(`Context Setter generation failed:`, { 
          error: error?.message, 
          finishReason: error?.finishReason, 
          usage: error?.usage 
        });
        throw new Error("Failed to generate description");
      }
    } catch (promptLoadingError) {
      logger.error('Failed to load or prepare context setter prompt:', promptLoadingError);
      throw new Error("Failed to load context setter prompt, cannot proceed.");
    }

    if (!description) {
      logger.error('Description is unexpectedly undefined after generation block.');
      throw new Error("Failed to generate description, cannot proceed.");
    }

    // Step 5: Update profile with final description (EXACT same as manual)
    logger.info('Updating profile with generated description...');
    const descriptionUpdate = {
      organisationUrl: initialUpdate[0].organisationUrl,
      organisationName: initialUpdate[0].organisationName,
      organisationDescription: description,
      organisationDescriptionCompleted: true,
    };
    
    await updateProfile(userId, descriptionUpdate);
    logger.info('Description update successful');

    // Mark context report generation as complete (Step 2.2)
    await updateOnboardingStep(userId, 'step2BrandingComplete'); // Reuse this to track context report completion

    // Step 6: Extract Branding (NEW)
    logger.info('Starting branding extraction...');
    let brandingUpdated = false;

    try {
      logger.info(`Fetching brand details for: ${organisationUrl}`);
      const brandDetails = await fetchBrandDetails(organisationUrl);
      logger.info(`Brand details result:`, brandDetails);
      
      // Only save branding if we actually found real data (not empty defaults)
      if (brandDetails.logoUrl || brandDetails.primaryColor) {
        const brandingUpdateData: any = {};
        
        if (brandDetails.logoUrl) {
          brandingUpdateData.logoUrl = brandDetails.logoUrl;
          logger.info(`Logo extracted: ${brandDetails.logoUrl}`);
        }
        
        if (brandDetails.primaryColor) {
          brandingUpdateData.buttonColor = brandDetails.primaryColor;
          brandingUpdateData.titleColor = brandDetails.primaryColor; // Same as primary for now
          logger.info(`Primary color extracted: ${brandDetails.primaryColor}`);
        }
        
        if (Object.keys(brandingUpdateData).length > 0) {
          await updateProfile(userId, brandingUpdateData);
          brandingUpdated = true;
          logger.info(`Branding updated for user ${userId}:`, brandingUpdateData);
        }
      } else {
        logger.info(`No branding data found for ${organisationUrl} - modal will use system defaults`);
      }
    } catch (error) {
      logger.warn(`Branding extraction failed for user ${userId}, continuing without branding:`, error);
      // Don't fail the entire process if branding fails
    }
    
    // Mark branding step as complete regardless of success (Step 6 complete)
    await updateOnboardingStep(userId, 'step4AgentCreated'); // Reuse this to track branding completion

    // Step 7: Create Modal + Agents (NEW)
    logger.info('Starting modal and agent creation...');
    let modalCreated = false;
    let modalId: string | undefined;

    try {
      const modalResult = await createAutomatedModal(userId, organisationName, description);
      if (modalResult.success) {
        modalCreated = true;
        modalId = modalResult.modalId;
        logger.info(`Modal created successfully: ${modalId}`);
      } else {
        logger.warn(`Modal creation failed: ${modalResult.error}`);
      }
    } catch (error) {
      logger.warn(`Modal creation failed for user ${userId}, continuing without modal:`, error);
      // Don't fail the entire process if modal creation fails
    }

    // Step 8: Mark final onboarding steps complete (UPDATED)
    // Note: step1ContextComplete and step2BrandingComplete already marked above
    if (modalCreated) {
      await updateOnboardingStep(userId, 'step3PersonasReviewed'); // Mark as complete since we auto-created
    }

    // Step 9: Mark automation as completed (NEW)
    await completeAutomatedOnboarding(userId);
    
    logger.info(`✅ Automated onboarding completed for user ${userId}. Branding: ${brandingUpdated ? 'Updated' : 'Skipped'}, Modal: ${modalCreated ? 'Created' : 'Failed'}`);

    return { success: true, description, brandingUpdated, modalCreated, modalId };

  } catch (error) {
    logger.error(`❌ Automated context generation failed for user ${userId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 