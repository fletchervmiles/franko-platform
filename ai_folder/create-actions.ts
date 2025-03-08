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
import { o1Model, geminiFlashModel } from ".";
import { arrayToNumberedObjectives, type ConversationPlan, type Objective } from "@/components/conversationPlanSchema";
import { getUserProfile } from "@/db/queries/queries";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";

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
    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace all template variables with actual values
    const systemPrompt = promptTemplate
      .replace('{conversation_topic}', topic)
      .replace('{converastion_duration}', duration)
      .replace('{additional_details}', additionalDetails || 'None provided')
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');
    
    // Add retry logic for the generateObject call
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount < maxRetries) {
      try {
        const { object: rawPlan } = await generateObject({
          model: o1Model,
          system: `${systemPrompt}`,
          prompt: "",
          schema: z.object({
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

        // Validate that we have at least one objective
        if (!rawPlan || !rawPlan.objectives || rawPlan.objectives.length === 0) {
          throw new Error("Generated plan must have at least one objective");
        }

        // Transform the raw plan to match our schema
        const objectivesArray = rawPlan.objectives.map(obj => ({
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

        // Save the conversation plan (the conversion to numbered objectives happens in the query function)
        await updateChatInstanceConversationPlan(chatId, plan);

        logger.debug('Generated conversation plan from form data:', {
          title: plan.title,
          duration: plan.duration,
          objectiveCount: plan.objectives.length
        });

        // Create and save the objective progress
        await createObjectiveProgressFromPlan(plan, chatId);
        
        // Non-blocking welcome description generation
        // This runs after the conversation plan is generated but doesn't block the flow
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

        return plan;
      } catch (error) {
        lastError = error;
        logger.error(`Conversation plan generation attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        // If we've reached max retries, throw the last error
        if (retryCount >= maxRetries) {
          logger.error('All conversation plan generation attempts failed:', lastError);
          throw new Error('Failed to generate conversation plan after multiple attempts');
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // This should never be reached due to the throw in the catch block above
    throw lastError;
  } catch (error) {
    logger.error('Error generating conversation plan from form:', error);
    throw error;
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
    
    // Add retry logic for the generateText call
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount < maxRetries) {
      try {
        // Use generateText instead of generateObject as specified
        const response = await generateText({
          model: geminiFlashModel,
          system: systemPrompt,
          prompt: "",
          temperature: 0.7, // A bit of creativity for engaging content
          maxTokens: 150,   // Keep responses brief
        });
        
        // Extract the text content from the response
        const welcomeDescription = response.text || "";

        // Save the welcome description to the database
        await updateWelcomeDescription(chatId, welcomeDescription);
        
        logger.debug('Generated welcome description successfully', { 
          chatId,
          descriptionLength: welcomeDescription.length
        });
        
        return;
      } catch (error) {
        lastError = error;
        logger.error(`Welcome description generation attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        // If we've reached max retries, log the error but don't throw
        if (retryCount >= maxRetries) {
          logger.error('All welcome description generation attempts failed:', lastError);
          return; // Don't throw, this is non-blocking
        }
        
        // Wait before retrying (simple backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
      }
    }
  } catch (error) {
    // Catch and log any errors but don't propagate them
    logger.error('Error generating welcome description:', error);
    // Don't throw - this is a non-blocking operation
  }
}
