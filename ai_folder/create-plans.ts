/**
 * Automated Conversation Plan Generation
 * 
 * This file contains functions for generating conversation plans automatically
 * during the onboarding process. It generates plans for all 6 use-case agents
 * in parallel for maximum efficiency.
 */

import { generateObject } from "ai";
import { z } from "zod";
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/logger';
import { updateChatInstanceConversationPlan } from "@/db/queries/chat-instances-queries";
import { o3Model, gemini25ProPreviewModel } from ".";
import type { ConversationPlan } from "@/components/conversationPlanSchema";
import { createObjectiveProgressFromPlan } from "./create-actions";
import { agentsData } from "@/lib/agents-data";
import { createModal } from "@/db/queries/modals-queries";
import { createModalChatInstances } from "@/db/queries/modal-chat-instances-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { isDarkColor } from "@/lib/color-utils";

/**
 * Map agent IDs to their corresponding prompt files
 */
const AGENT_PROMPT_MAP: Record<string, string> = {
  'AGENT01': '01discovery_conversation_plan_prompt.md',        // Discovery Trigger
  'AGENT02': '02problem_persona_conversation_plan_prompt.md',  // Persona + Problem  
  'AGENT03': '03upgrade_decision_conversation_plan_prompt.md', // Activation Hurdles
  'AGENT04': '04key_benefit_conversation_plan_prompt.md',      // Key Benefit
  'AGENT05': '05improvement_conversation_plan_prompt.md',      // Improvements & Friction
  'AGENT06': '06new_feature_conversation_plan_prompt.md',      // Feature Wishlist
};

/**
 * Generate conversation plans for all 6 use-case agents in parallel
 */
export async function generateAllUseCaseConversationPlans({
  userId,
  organisationName,
  organisationDescription,
  chatInstanceIds
}: {
  userId: string;
  organisationName: string;
  organisationDescription: string;
  chatInstanceIds: Record<string, string>; // agentId -> chatInstanceId
}): Promise<{ success: boolean; results: Record<string, any>; errors: string[] }> {
  
  logger.info(`Starting parallel conversation plan generation for ${Object.keys(chatInstanceIds).length} agents`);
  
  const startTime = Date.now();
  const errors: string[] = [];
  const results: Record<string, any> = {};
  
  // Generate all plans in parallel
  const planPromises = Object.entries(chatInstanceIds).map(async ([agentId, chatInstanceId]) => {
    try {
      const plan = await generateUseCaseConversationPlan({
        agentId,
        chatInstanceId,
        organisationName,
        organisationDescription
      });
      
      results[agentId] = { success: true, plan, chatInstanceId };
      logger.info(`✅ Conversation plan generated for ${agentId}`);
      
    } catch (error) {
      const errorMsg = `Failed to generate plan for ${agentId}: ${error}`;
      errors.push(errorMsg);
      results[agentId] = { success: false, error: errorMsg, chatInstanceId };
      logger.error(`❌ ${errorMsg}`);
    }
  });
  
  // Wait for all plans to complete
  await Promise.allSettled(planPromises);
  
  const duration = Date.now() - startTime;
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(chatInstanceIds).length;
  
  logger.info(`Conversation plan generation completed: ${successCount}/${totalCount} successful in ${duration}ms`);
  
  return {
    success: successCount > 0, // Success if at least one plan was generated
    results,
    errors
  };
}

/**
 * Generate a conversation plan for a specific use-case agent
 */
async function generateUseCaseConversationPlan({
  agentId,
  chatInstanceId,
  organisationName,
  organisationDescription
}: {
  agentId: string;
  chatInstanceId: string;
  organisationName: string;
  organisationDescription: string;
}): Promise<ConversationPlan> {
  
  logger.debug(`Generating conversation plan for agent ${agentId}`, { 
    chatInstanceId,
    organisationName
  });
  
  // Get agent data
  const agentData = agentsData.find(agent => agent.id === agentId);
  if (!agentData) {
    throw new Error(`Agent data not found for ${agentId}`);
  }
  
  // Get prompt file path
  const promptFileName = AGENT_PROMPT_MAP[agentId];
  if (!promptFileName) {
    throw new Error(`Prompt file mapping not found for ${agentId}`);
  }
  
  // Load the prompt template
  const promptPath = path.join(process.cwd(), 'agent_prompts', 'use-case-plans', promptFileName);
  let promptTemplate: string;
  
  try {
    promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt template for ${agentId}: ${error}`);
  }
  
  // Replace template variables
  const systemPrompt = promptTemplate
    .replace(/{organisation_name}/g, organisationName)
    .replace(/{organisation_description}/g, organisationDescription)
    .replace(/{organisation_description_demo_only}/g, ''); // Empty for now
  
  logger.debug(`Prompt template loaded and populated for ${agentId}`, {
    promptLength: systemPrompt.length,
    agentName: agentData.name
  });
  
  // Define the conversation plan schema (same as create-actions.ts)
  const conversationPlanSchema = z.object({
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
  });
  
  // Try primary model first, then fallback
  const primaryModel = o3Model;
  const fallbackModel = gemini25ProPreviewModel;
  
  let rawPlan: any;
  let modelUsed: string;
  
  try {
    // Attempt 1: Primary model (o3)
    modelUsed = `OpenAI o3`;
    logger.debug(`Attempting conversation plan generation with primary model: ${modelUsed} for ${agentId}`);
    
    const result = await generateObject({
      model: primaryModel,
      system: systemPrompt,
      prompt: `Generate a conversation plan for ${agentData.name} agent focused on: ${agentData.description}`,
      schema: conversationPlanSchema,
    });
    
    rawPlan = result.object;
    logger.debug(`Successfully generated plan with ${modelUsed} for ${agentId}`);
    
  } catch (primaryError) {
    logger.warn(`Primary model failed for ${agentId}, trying fallback:`, primaryError);
    
    // Attempt 2: Fallback model
    modelUsed = `Gemini 2.5 Pro Preview`;
    logger.debug(`Attempting conversation plan generation with fallback model: ${modelUsed} for ${agentId}`);
    
    try {
      const fallbackResult = await generateObject({
        model: fallbackModel,
        system: systemPrompt,
        prompt: `Generate a conversation plan for ${agentData.name} agent focused on: ${agentData.description}`,
        schema: conversationPlanSchema,
      });
      
      rawPlan = fallbackResult.object;
      logger.debug(`Successfully generated plan with fallback ${modelUsed} for ${agentId}`);
      
    } catch (fallbackError) {
      logger.error(`Both models failed for ${agentId}:`, { primaryError, fallbackError });
      throw new Error(`Failed to generate conversation plan for ${agentId} with both models`);
    }
  }
  
  // Validate the generated plan
  if (!rawPlan || !rawPlan.objectives || rawPlan.objectives.length === 0) {
    throw new Error(`Generated plan for ${agentId} is missing objectives`);
  }
  
  // Transform to our schema format
  const objectivesArray = rawPlan.objectives.map((obj: any) => ({
    objective: obj.objective || "Untitled Objective",
    desiredOutcome: obj.desiredOutcome || "Key insight to be gained",
    agentGuidance: Array.isArray(obj.agentGuidance) ? obj.agentGuidance : ["Guide the conversation naturally"],
    expectedConversationTurns: obj.expectedConversationTurns || "2-3"
  }));
  
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
  
  // Save the conversation plan to the database
  await updateChatInstanceConversationPlan(chatInstanceId, plan);
  
  // Create and save the objective progress
  await createObjectiveProgressFromPlan(plan, chatInstanceId);
  
  logger.info(`Conversation plan saved for ${agentId}:`, {
    title: plan.title,
    duration: plan.duration,
    objectiveCount: plan.objectives.length,
    modelUsed,
    chatInstanceId
  });
  
  return plan;
}

/**
 * Create an automated modal with all 6 use-case agents
 */
export async function createAutomatedModal(
  userId: string,
  organisationName: string,
  organisationDescription: string
): Promise<{ success: boolean; modalId?: string; error?: string }> {
  
  logger.info(`Creating automated modal for user ${userId}`);
  
  try {
    // Get user profile for branding
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Generate unique embed slug
    const timestamp = Date.now();
    const slugBase = organisationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const embedSlug = `${slugBase}-${timestamp}`.substring(0, 50);
    
    // Create brand settings using profile branding + defaults
    const themeDefault = profile.buttonColor && isDarkColor(profile.buttonColor) ? "dark" : "light";

    const brandSettings = {
      interface: {
        displayName: `We'd love your feedback`,
        instructions: `Help us improve ${organisationName} by sharing your feedback. Each conversation is just 1-2 minutes.`,
        theme: themeDefault as "light" | "dark",
        primaryBrandColor: profile.buttonColor || "",
        advancedColors: false,
        chatIconText: "Feedback",
        chatIconColor: profile.buttonColor || "",
        userMessageColor: profile.buttonColor || "",
        chatHeaderColor: profile.titleColor || null,
        alignChatBubble: "right" as const,
        profilePictureUrl: profile.logoUrl || null,
      },
      agents: {
        enabledAgents: {
          AGENT01: true,
          AGENT02: true,
          AGENT03: true,
          AGENT04: true,
          AGENT05: true,
          AGENT06: true,
        },
      },
    };
    
    // Create the modal
    const modal = await createModal({
      userId,
      name: "New Modal",
      embedSlug,
      brandSettings,
      isActive: true,
    });
    
    logger.info(`Modal created with ID: ${modal.id}`);
    
    // Create chat instances without conversation plans first
    const agentIds = ['AGENT01', 'AGENT02', 'AGENT03', 'AGENT04', 'AGENT05', 'AGENT06'];
    const enabledAgents = agentIds.map(agentId => ({
      agentType: agentId,
      conversationPlan: null, // Will be populated by conversation plan generation
    }));
    
    const chatInstances = await createModalChatInstances(modal.id, userId, enabledAgents);
    
    // Create mapping of agentId -> chatInstanceId
    const chatInstanceIds: Record<string, string> = {};
    chatInstances.forEach(instance => {
      if (instance.agentType) {
        chatInstanceIds[instance.agentType] = instance.id;
      }
    });
    
    logger.info(`Created ${chatInstances.length} chat instances for modal ${modal.id}`);
    
    // Generate conversation plans for all agents in parallel
    const planResults = await generateAllUseCaseConversationPlans({
      userId,
      organisationName,
      organisationDescription,
      chatInstanceIds,
    });
    
    if (!planResults.success) {
      logger.error(`All conversation plan generation failed for modal ${modal.id}:`, planResults.errors);
      throw new Error(`Failed to generate conversation plans: ${planResults.errors.join(', ')}`);
    }
    
    const successfulPlans = Object.values(planResults.results).filter(r => r.success).length;
    logger.info(`Modal creation completed: ${modal.id} with ${successfulPlans}/6 conversation plans`);
    
    return {
      success: true,
      modalId: modal.id,
    };
    
  } catch (error) {
    logger.error(`Failed to create automated modal for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
