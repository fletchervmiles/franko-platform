/**
 * Create Actions
 * 
 * This file contains utility functions specifically for the conversation creation flow.
 * It reuses functionality from the main actions.ts file but adapts it for form submission.
 */

import { generateObject } from "ai";
import { z } from "zod";
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/logger';
import { updateChatInstanceConversationPlan, updateChatInstanceProgress } from "@/db/queries/chat-instances-queries";
import { o1Model } from ".";
import { arrayToNumberedObjectives, type ConversationPlan, type Objective } from "@/components/conversationPlanSchema";
import { getUserProfile } from "@/db/queries/queries";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";

/**
 * Creates an objective progress object based on the conversation plan
 * The number of objectives in the progress tracker is one fewer than in the conversation plan
 */
async function createObjectiveProgressFromPlan(plan: ConversationPlan, chatId: string): Promise<ObjectiveProgress> {
  // Extract the number of objectives from the plan
  const objectiveCount = plan.objectives.length;
  
  // Create one fewer objective in the progress tracker
  const progressObjectiveCount = Math.max(1, objectiveCount - 1);
  
  // Create the objective progress object
  const objectiveProgress: ObjectiveProgress = {
    objectives: {}
  };
  
  // Populate the objectives with the correct status
  for (let i = 0; i < progressObjectiveCount; i++) {
    // Create keys like objective01, objective02, etc.
    const paddedIndex = String(i + 1).padStart(2, '0');
    const objectiveKey = `objective${paddedIndex}`;
    
    objectiveProgress.objectives[objectiveKey] = {
      status: i === 0 ? "current" : "tbc"
    };
  }
  
  logger.debug('Creating objective progress:', {
    chatId,
    planObjectiveCount: objectiveCount,
    progressObjectiveCount
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
