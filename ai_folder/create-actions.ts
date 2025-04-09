/**
 * Create Actions
 * 
 * This file contains utility functions specifically for the conversation creation flow.
 * It reuses functionality from the main actions.ts file but adapts it for form submission.
 */

import { generateObject, generateText } from "ai";
import { z } from "zod";
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/logger';
import { updateChatInstanceConversationPlan, updateChatInstanceProgress, updateWelcomeDescription } from "@/db/queries/chat-instances-queries";
import { o1Model, geminiFlashModel, gemini25ProPreviewModel } from ".";
import { arrayToNumberedObjectives, type ConversationPlan, type Objective } from "@/components/conversationPlanSchema";
import { getProfile } from "@/db/queries/profiles-queries";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";
import { updateProfile } from "@/db/queries/profiles-queries";

/**
 * Creates an objective progress object based on the conversation plan
 * The number of objectives in the progress tracker is one fewer than in the conversation plan
 * 
 * This is the authoritative implementation that is also used by actions.ts
 */
export async function createObjectiveProgressFromPlan(plan: ConversationPlan, chatId: string): Promise<ObjectiveProgress> {
  // Extract the number of objectives from the plan
  const objectiveCount = plan.objectives.length;
  
  // Create one fewer objective in the progress tracker
  const progressObjectiveCount = Math.max(1, objectiveCount - 1);
  
  // Calculate totals for min/max turns
  let totalMin = 0;
  let totalMax = 0;
  
  // Create the objective progress object
  const objectiveProgress: ObjectiveProgress = {
    overall_turns: 0,
    expected_total_min: 0,
    expected_total_max: 0,
    objectives: {}
  };
  
  // Function to parse turn expectations
  function parseTurnExpectation(turnString: string): { min: number; max: number } {
    // Remove any whitespace and convert to string
    const cleaned = String(turnString).trim();
    
    // Handle range format (e.g., "2-3")
    if (cleaned.includes('-')) {
      const [min, max] = cleaned.split('-').map(Number);
      return { min, max };
    }
    
    // Handle approximate format (e.g., "≈3")
    if (cleaned.includes('≈')) {
      const base = Number(cleaned.replace('≈', ''));
      return { min: base - 1, max: base + 1 };
    }
    
    // Handle single number (e.g., "3")
    const exact = Number(cleaned);
    return { min: exact, max: exact };
  }
  
  // Populate the objectives with the correct status and expected turns
  for (let i = 0; i < progressObjectiveCount; i++) {
    // Create keys like objective01, objective02, etc.
    const paddedIndex = String(i + 1).padStart(2, '0');
    const objectiveKey = `objective${paddedIndex}`;
    
    // Get expected turns from the plan (use the corresponding objective)
    const planObjective = plan.objectives[i];
    const { min, max } = parseTurnExpectation(planObjective.expectedConversationTurns || "1");
    
    objectiveProgress.objectives[objectiveKey] = {
      status: i === 0 ? "current" : "tbc",
      turns_used: 0,
      expected_min: min,
      expected_max: max
    };
    
    // Add to totals
    totalMin += min;
    totalMax += max;
  }
  
  // Set the total expected turns
  objectiveProgress.expected_total_min = totalMin;
  objectiveProgress.expected_total_max = totalMax;
  
  logger.debug('Creating objective progress:', {
    chatId,
    planObjectiveCount: objectiveCount,
    progressObjectiveCount,
    expectedTotalMin: totalMin,
    expectedTotalMax: totalMax
  });
  
  // Save the objective progress to the database
  await updateChatInstanceProgress(chatId, objectiveProgress);
  
  return objectiveProgress;
}

/**
 * Generates a conversation plan from form data
 * This is a simplified version of the generateConversationPlan function in actions.ts
 * adapted for use in the form submission process
 */
export async function generateConversationPlanFromForm({
  userId,
  chatId,
  topic,
  duration,
  additionalDetails
}: {
  userId: string;
  chatId: string;
  topic: string;
  duration: string;
  additionalDetails?: string;
}) {
  try {
    logger.debug('Generating conversation plan from form data:', { 
      chatId, 
      userId,
      topicLength: topic.length,
      duration
    });
    
    // Load the prompt template
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'conversation_plan_agent_prompt.md'),
      'utf-8'
    );

    // Get user profile data
    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace all template variables with actual values
    const systemPrompt = promptTemplate
      .replace('{conversation_topic}', topic)
      .replace('{converastion_duration}', duration)
      .replace('{additional_details}', additionalDetails || 'None provided')
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '')
      .replace('{organisation_description_demo_only}', profile.organisationDescriptionDemoOnly || '');
    
    // Log the populated prompt for debugging
    console.log('\n=== CONVERSATION PLAN PROMPT ===');
    console.log('ChatId:', chatId);
    console.log('Topic:', topic);
    console.log('Organisation:', profile.organisationName);
    console.log('\nFull Prompt:');
    console.log(systemPrompt);
    console.log('=== END CONVERSATION PLAN PROMPT ===\n');
    
    // Define models to try
    const primaryModel = o1Model;
    const fallbackModel = gemini25ProPreviewModel;
    
    let rawPlan: any; // Use 'any' for now, will be validated by schema
    let modelUsed: string | undefined;

    try {
      // Attempt 1: Try the primary model (o1)
      modelUsed = `OpenAI o1`;
      logger.ai(`Attempting conversation plan generation with primary model: ${modelUsed}`);
      const modelStartTime = new Date();
      
      const result = await generateObject({
        model: primaryModel,
        system: `${systemPrompt}`,
        prompt: "", // Keep prompt empty as system prompt contains all context
        schema: z.object({ // Keep the same schema
          thinking: z.object({
            topicStrategy: z.string().describe("~200-word brainstorm on the topic"),
            appliedtoOrganisation: z.string().describe("~200-word application to the organization"),
            userPersona: z.string().describe("~100-word overview of the customer persona"),
            durationThoughts: z.string().describe("Turn distribution reasoning + any time-check guidelines"),
          }),
          title: z.string().describe("Jargon-free title with key context"),
          duration: z.string().describe("Estimate using User input (e.g., '3 minutes', '≈2', '2')"),
          summary: z.string().describe("25-50 word summary with strategic value"),
          objectives: z.array(
            z.object({
              objective: z.string().describe("Action/goal focus area"),
              desiredOutcome: z.string().describe("Result/importance of the objective"),
              agentGuidance: z.array(z.string()).describe("2-5 guidance thoughts focused on learning outcomes"),
              expectedConversationTurns: z.string().describe("Expected number of conversation turns")
            })
          ).describe("Time-aware objectives sorted by priority")
        }),
      });
      rawPlan = result.object;

      const modelEndTime = new Date();
      const modelDurationSec = (modelEndTime.getTime() - modelStartTime.getTime()) / 1000;
      logger.ai(`Successfully generated plan with ${modelUsed} (duration: ${modelDurationSec.toFixed(2)}s)`);

    } catch (primaryError) {
      logger.error(`Primary model (${modelUsed}) failed:`, primaryError);
      
      // Attempt 2: Fallback to gemini25ProPreviewModel
      modelUsed = `Gemini 2.5 Pro Preview (gemini-2.5-pro-preview-03-25)`;
      logger.ai(`Attempting conversation plan generation with fallback model: ${modelUsed}`);
      const fallbackStartTime = new Date();

      try {
        const fallbackResult = await generateObject({
          model: fallbackModel, // Use the fallback model
          system: `${systemPrompt}`,
          prompt: "",
          schema: z.object({ // Use the same schema
            thinking: z.object({
              topicStrategy: z.string().describe("~200-word brainstorm on the topic"),
              appliedtoOrganisation: z.string().describe("~200-word application to the organization"),
              userPersona: z.string().describe("~100-word overview of the customer persona"),
              durationThoughts: z.string().describe("Turn distribution reasoning + any time-check guidelines"),
            }),
            title: z.string().describe("Jargon-free title with key context"),
            duration: z.string().describe("Estimate using User input (e.g., '3 minutes', '≈2', '2')"),
            summary: z.string().describe("25-50 word summary with strategic value"),
            objectives: z.array(
              z.object({
                objective: z.string().describe("Action/goal focus area"),
                desiredOutcome: z.string().describe("Result/importance of the objective"),
                agentGuidance: z.array(z.string()).describe("2-5 guidance thoughts focused on learning outcomes"),
                expectedConversationTurns: z.string().describe("Expected number of conversation turns")
              })
            ).describe("Time-aware objectives sorted by priority")
          }),
        });
        rawPlan = fallbackResult.object;

        const fallbackEndTime = new Date();
        const fallbackDurationSec = (fallbackEndTime.getTime() - fallbackStartTime.getTime()) / 1000;
        logger.ai(`Successfully generated plan with fallback ${modelUsed} (duration: ${fallbackDurationSec.toFixed(2)}s)`);

      } catch (fallbackError) {
        logger.error(`Fallback model (${modelUsed}) also failed:`, fallbackError);
        // Throw the original error if fallback also fails, updated message
        throw new Error(`Failed to generate conversation plan with both o1 (primary) and Gemini 2.5 Pro (fallback) models. Primary error: ${primaryError}`);
      }
    }

    // Validate that we have at least one objective (rawPlan should be populated by now)
        if (!rawPlan || !rawPlan.objectives || rawPlan.objectives.length === 0) {
      // This case might happen if the model returns an empty/invalid object structure
      logger.error('Generated plan is missing objectives despite successful API call.', { modelUsed, rawPlan });
      throw new Error("Generated plan must have at least one objective, but received an empty or invalid structure.");
        }

    // Transform the raw plan to match our schema (same logic as before)
    const objectivesArray = rawPlan.objectives.map((obj: any) => ({ // Add 'any' type for safety
          objective: obj.objective || "Untitled Objective",
          desiredOutcome: obj.desiredOutcome || "Key insight to be gained",
          agentGuidance: Array.isArray(obj.agentGuidance) ? obj.agentGuidance : ["Guide the conversation naturally"],
          expectedConversationTurns: obj.expectedConversationTurns || "1"
        }));

        // Create the plan with the array format for frontend compatibility
        const plan: ConversationPlan = {
          thinking: {
            topicStrategy: rawPlan.thinking.topicStrategy,
            appliedtoOrganisation: rawPlan.thinking.appliedtoOrganisation,
            userPersona: rawPlan.thinking.userPersona,
            durationThoughts: rawPlan.thinking.durationThoughts,
          },
          title: rawPlan.title,
          duration: rawPlan.duration,
          summary: rawPlan.summary,
          objectives: objectivesArray
        };

        // Save the conversation plan
        await updateChatInstanceConversationPlan(chatId, plan);

        // Create and save the objective progress
        await createObjectiveProgressFromPlan(plan, chatId);
        
        // Non-blocking counter update for chat instance generations
        Promise.resolve().then(async () => {
          try {
            const profile = await getProfile(userId);
            if (profile) {
              const currentCount = profile.totalChatInstanceGenerationsUsed || 0;
              await updateProfile(userId, {
                totalChatInstanceGenerationsUsed: currentCount + 1
              });
              logger.debug('Updated chat instance generation count:', { 
                userId, 
                newCount: currentCount + 1 
              });
            }
          } catch (error) {
            logger.error('Failed to update chat instance generation count:', error);
            // Don't throw - this is non-blocking
          }
        });
        
        // Non-blocking welcome description generation
        Promise.resolve().then(() => {
          generateWelcomeDescription({
            chatId,
            title: plan.title,
            duration: plan.duration,
            summary: plan.summary
          }).catch(error => {
            logger.error('Failed to generate welcome description:', error);
          });
        });

        logger.debug('Generated conversation plan from form data:', {
          title: plan.title,
          duration: plan.duration,
      objectiveCount: plan.objectives.length,
      modelUsed // Log which model ended up being used
        });

        return plan;
  } catch (error) {
    logger.error('Error generating conversation plan from form:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Generates a welcome description for a conversation using GeminiFlash
 * 
 * This function is designed to be non-blocking - it handles errors internally
 * and doesn't affect the main conversation flow if it fails.
 * 
 * @param params.chatId The ID of the chat instance to update
 * @param params.title The title from the conversation plan
 * @param params.duration The duration from the conversation plan
 * @param params.summary The summary from the conversation plan
 */
export async function generateWelcomeDescription({
  chatId,
  title,
  duration,
  summary
}: {
  chatId: string;
  title: string;
  duration: string;
  summary: string;
}): Promise<void> {
  try {
    logger.debug('Generating welcome description:', { 
      chatId,
      title
    });
    
    // Load the prompt template - first try agent_prompts directory, then try prompts directory
    let promptTemplate;
    try {
      promptTemplate = fs.readFileSync(
        path.join(process.cwd(), 'agent_prompts', 'welcome_description.md'),
        'utf-8'
      );
    } catch (fileError) {
      // Fallback to the prompts directory where the file might have been moved
      try {
        promptTemplate = fs.readFileSync(
          path.join(process.cwd(), 'prompts', 'page_description.md'),
          'utf-8'
        );
        logger.debug('Using page_description.md from prompts directory as fallback');
      } catch (fallbackError) {
        logger.error('Failed to load welcome description template from both locations', { 
          originalError: fileError, 
          fallbackError 
        });
        throw new Error('Welcome description template not found');
      }
    }

    // Replace template variables with actual values
    const systemPrompt = promptTemplate
      .replace('{title}', title)
      .replace('{duration}', duration)
      .replace('{summary}', summary);
    
    // Add retry logic for the generateObject call
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount < maxRetries) {
      try {
        // Use generateObject instead of generateText to get structured output
        const { object: welcomeContent } = await generateObject({
          model: o1Model,
          system: systemPrompt,
          prompt: "",
          schema: z.object({
            welcome_heading: z.string().describe("~6-10 words: conversational, friendly headline phrased as a direct question clearly referencing user's experience and brand/company name"),
            welcome_card_description: z.string().describe("~15-25 words: clearly, professionally explains the chat (~duration, AI assistant, number of questions clearly mapped below, and expresses genuine appreciation)"),
            welcome_description: z.string().describe("~6-8 words max: short, conversational phrase summarizing chat topic from user's perspective")
          }),
        });
        
        // Save all welcome content fields to the database
        await updateWelcomeDescription(chatId, 
          welcomeContent.welcome_description,
          welcomeContent.welcome_heading,
          welcomeContent.welcome_card_description
        );
        
        logger.debug('Generated welcome content successfully', { 
          chatId,
          headingLength: welcomeContent.welcome_heading.length,
          descriptionLength: welcomeContent.welcome_description.length,
          cardDescriptionLength: welcomeContent.welcome_card_description.length
        });
        
        return;
      } catch (error) {
        lastError = error;
        logger.error(`Welcome content generation attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        // If we've reached max retries, log the error but don't throw
        if (retryCount >= maxRetries) {
          logger.error('All welcome content generation attempts failed:', lastError);
          return; // Don't throw, this is non-blocking
        }
        
        // Wait before retrying (simple backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }
  } catch (error) {
    // Catch and log any errors but don't propagate them
    logger.error('Error generating welcome content:', error);
    // Don't throw - this is a non-blocking operation
  }
}
