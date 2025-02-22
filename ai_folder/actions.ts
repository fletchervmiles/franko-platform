/**
 * Migration Instructions
 * ====================
 * 
 * Dependencies Required:
 * - @tavily/core: For web search functionality
 * - @vercel/blob: For file handling
 * - ai: For generateObject and streamObject utilities
 * - zod: For schema validation
 * - path, fs: Node.js built-in modules
 * 
 * Environment Variables Needed:
 * - TAVILY_API_KEY: Required for web search
 * - GEMINI_API_KEY: Required for AI model
 * 
 * Integration Points:
 * 1. AI Model Configuration:
 *    - Ensure geminiFlashModel is properly configured in your AI setup
 *    - Update model configuration if using different provider
 * 
 * 2. Prompt Files:
 *    - Create 'agent_prompts' directory in project root
 *    - Add required prompt files (e.g., interview_guide_creator.md)
 * 
 * 3. Type Definitions:
 *    - Ensure CoreMessage type from 'ai' package is available
 *    - Add any custom type definitions used in your schemas
 * 
 * 4. Error Handling:
 *    - Implement error logging strategy
 *    - Add error boundaries in React components using these functions
 * 
 * Common Pitfalls:
 * - Ensure proper path resolution for prompt files in production
 * - Handle rate limiting for Tavily API calls
 * - Validate AI model responses against schemas
 * - Handle streaming responses appropriately in UI
 * 
 * Security Considerations:
 * - Protect API keys in environment variables
 * - Validate user input before passing to AI model
 * - Implement request rate limiting
 * - Add authentication checks before expensive operations
 */

/**
 * Flight Booking Action Generators
 * 
 * This file contains utility functions for generating sample flight-related data
 * including flight status, search results, seat selections, and pricing.
 * These functions use the Gemini Flash model to generate realistic mock data
 * for demonstration purposes.
 */

// Import required dependencies for object generation and schema validation
import { generateObject, streamObject } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { CoreMessage } from "ai";
import path from 'path';
import fs from 'fs';
import { LRUCache } from 'lru-cache';
import { getUserProfile } from "@/db/queries/queries";
import { updateChatInstanceConversationPlan, getChatInstanceProgress, updateChatInstanceProgress } from "@/db/queries/chat-instances-queries";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";
import { QueryClient } from "@tanstack/react-query";
import { queryClient } from "@/components/utilities/query-provider";

// Import the AI model configuration
import { geminiFlashModel, geminiProModel } from ".";

// Cache for populated conversation plan prompts
const conversationPlanPromptCache = new LRUCache<string, string>({
  max: 100, // Smaller cache since it's used less frequently
  ttl: 1000 * 60 * 60, // 1 hour TTL, same as main prompt
});

// Cache for thinking help prompts
const thinkingHelpPromptCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

// Cache for objective update prompts
const objectiveUpdatePromptCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

// Function to get populated conversation plan prompt
async function getPopulatedConversationPlanPrompt(userId: string): Promise<string> {
  try {
    // Check cache first
    const cachedPrompt = conversationPlanPromptCache.get(userId);
    if (cachedPrompt) {
      return cachedPrompt;
    }

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

    // Replace template variables with actual values
    const populatedPrompt = promptTemplate
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    // Cache the result
    conversationPlanPromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    console.error('Error populating conversation plan prompt:', error);
    throw error;
  }
}

// Function to get populated thinking help prompt
async function getPopulatedThinkingHelpPrompt(userId: string): Promise<string> {
  try {
    // Check cache first
    const cachedPrompt = thinkingHelpPromptCache.get(userId);
    if (cachedPrompt) {
      return cachedPrompt;
    }

    // Load the prompt template
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'thinking_help_prompt.md'),
      'utf-8'
    );

    // Get user profile data
    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace template variables with actual values
    const populatedPrompt = promptTemplate
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    // Cache the result
    thinkingHelpPromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    console.error('Error populating thinking help prompt:', error);
    throw error;
  }
}

// Function to get populated objective update prompt
async function getPopulatedObjectiveUpdatePrompt(userId: string): Promise<string> {
  try {
    // Check cache first
    const cachedPrompt = objectiveUpdatePromptCache.get(userId);
    if (cachedPrompt) {
      return cachedPrompt;
    }

    // Load the prompt template
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'objective_update_prompt.md'),
      'utf-8'
    );

    // Get user profile data
    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace template variables with actual values
    const populatedPrompt = promptTemplate
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    // Cache the result
    objectiveUpdatePromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    console.error('Error populating objective update prompt:', error);
    throw error;
  }
}

// Export function to invalidate conversation plan prompt cache
export function invalidateConversationPlanPromptCache(userId: string) {
  conversationPlanPromptCache.delete(userId);
}

// Export function to invalidate thinking help prompt cache
export function invalidateThinkingHelpPromptCache(userId: string) {
  thinkingHelpPromptCache.delete(userId);
}

// Export function to invalidate objective update prompt cache
export function invalidateObjectiveUpdatePromptCache(userId: string) {
  objectiveUpdatePromptCache.delete(userId);
}

import type { ConversationPlan } from "@/components/conversationPlanSchema";

export async function generateConversationPlan({ messages, userId, chatId }: { messages: CoreMessage[], userId: string, chatId: string }) {
  const systemPrompt = await getPopulatedConversationPlanPrompt(userId);
  
  console.log('\n=== CONVERSATION PLAN GENERATION REQUEST ===');
  console.log('System Prompt:', systemPrompt);
  console.log('Messages:', messages.map(m => ({
    role: m.role,
    content: m.content
  })));
  console.log('==========================================\n');

  const { object: rawPlan } = await generateObject({
    model: geminiProModel,
    system: systemPrompt,
    prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
    schema: z.object({
      title: z.string().describe("Jargon-free title with key context"),
      duration: z.string().describe("Estimate using User input (e.g., '3 minutes', '≈2', '2')"),
      summary: z.string().describe("1-sentence purpose statement with strategic value"),
      objectives: z.array(
        z.object({
          objective: z.string().optional().describe("Active-verb focus area"),
          obj1: z.string().optional().describe("Alternative objective format 1"),
          obj2: z.string().optional().describe("Alternative objective format 2"),
          obj3: z.string().optional().describe("Alternative objective format 3"),
          keyLearningOutcome: z.string().describe("Decision-driving insight"),
          focusPoints: z.array(z.string()).optional().describe("List of focus points for the objective"),
          expectedConversationTurns: z.string().optional().describe("Expected number of conversation turns")
        }).refine(
          data => data.objective || data.obj1 || data.obj2 || data.obj3,
          "At least one objective format must be present"
        )
      ).describe("Time-aware objectives sorted by priority")
    }),
  });

  // Transform the raw plan to match our schema
  const plan: ConversationPlan = {
    title: rawPlan.title,
    duration: rawPlan.duration,
    summary: rawPlan.summary,
    objectives: rawPlan.objectives.map(obj => ({
      objective: obj.objective || obj.obj1 || obj.obj2 || obj.obj3 || "Untitled Objective",
      keyLearningOutcome: obj.keyLearningOutcome,
      focusPoints: obj.focusPoints || [],
      expectedConversationTurns: obj.expectedConversationTurns || "1"
    }))
  };

  try {
    // Save the conversation plan
    await updateChatInstanceConversationPlan(chatId, plan);
  } catch (error) {
    console.error('Failed to save conversation plan:', error);
    // Continue even if save fails - don't block the response
  }

  console.log('\n=== CONVERSATION PLAN GENERATION RESPONSE ===');
  console.log('Generated Plan:', JSON.stringify(plan, null, 2));
  console.log('============================================\n');

  return plan;
}

export async function performWebSearch({ query }: { query: string }) {
  try {
    // Initialize Tavily client
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    
    // Use searchQNA for AI-optimized responses
    const results = await tvly.search(query, {
      searchDepth: "basic",
      includeAnswer: true,
      maxResults: 3
    });
    
    return {
      answer: results.answer,
      results: results.results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score
      })),
      responseTime: results.responseTime
    };
  } catch (error) {
    console.error('Tavily search failed:', error);
    throw error;
  }
}

export async function generateDisplayOptions({ text }: { text: string }) {
  const { object: options } = await generateObject({
    model: geminiFlashModel,
    prompt: `Generate display options for: ${text}`,
    schema: z.object({
      text: z.string().describe("Text to display above the options"),
      options: z.array(z.string()).describe("Array of clickable options to display"),
      type: z.literal("options").describe("Type of display")
    }),
  });

  return {
    text: options.text,
    options: options.options,
    type: "options" as const
  };
}

export async function thinkingHelp({ messages, userId }: { messages: CoreMessage[], userId: string }) {
  try {
    const systemPrompt = await getPopulatedThinkingHelpPrompt(userId);
    
    const { object: { text } } = await generateObject({
      model: geminiFlashModel,
      system: systemPrompt,
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
      schema: z.object({
        text: z.string().describe("The thinking help guidance text")
      }),
    });

    return text;
  } catch (error) {
    console.error('Error in thinking help:', error);
    return "Unable to provide thinking guidance.";
  }
}

export async function objectiveUpdate({ messages, userId, chatId }: { 
  messages: CoreMessage[], 
  userId: string,
  chatId: string
}) {
  try {
    const systemPrompt = await getPopulatedObjectiveUpdatePrompt(userId);
    
    // Get current progress
    let currentProgress = await getChatInstanceProgress(chatId);
    
    // If no progress exists, initialize it
    if (!currentProgress) {
      currentProgress = {
        objectives: {
          obj1: { status: "current", comments: [] },
          obj2: { status: "tbc", comments: [] },
          obj3: { status: "tbc", comments: [] }
        }
      };
    }
    
    const promptMessages = [
      ...messages,
      {
        role: 'system' as const,
        content: `Current objectives state:
${JSON.stringify(currentProgress, null, 2)}

Update the status of objectives based on the conversation. Mark objectives as:
- "done" if completed
- "current" for the active objective
- "tbc" for not yet started objectives

If two questions have been asked, treat that as done.

Add brief comments about progress made.`
      }
    ];

    const { object: progressUpdate } = await generateObject({
      model: geminiFlashModel,
      system: systemPrompt,
      prompt: promptMessages.map(m => `${m.role}: ${m.content}`).join('\n'),
      schema: z.object({
        objectives: z.object({
          obj1: z.object({
            status: z.enum(["done", "current", "tbc"]).describe("Current status of the objective"),
            comments: z.array(z.string()).describe("List of progress comments")
          }).describe("First objective tracking"),
          obj2: z.object({
            status: z.enum(["done", "current", "tbc"]).describe("Current status of the objective"),
            comments: z.array(z.string()).describe("List of progress comments")
          }).describe("Second objective tracking"),
          obj3: z.object({
            status: z.enum(["done", "current", "tbc"]).describe("Current status of the objective"),
            comments: z.array(z.string()).describe("List of progress comments")
          }).describe("Third objective tracking")
        }).describe("Collection of objectives and their progress")
      })
    });

    // Update progress in database
    await updateChatInstanceProgress(chatId, progressUpdate as ObjectiveProgress);

    return progressUpdate as ObjectiveProgress;
  } catch (error) {
    console.error('Error in objective update:', error);
    throw error;
  }
}
