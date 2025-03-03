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
import { generateObject, streamObject, generateText } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { CoreMessage } from "ai";
import path from 'path';
import fs from 'fs';
import { LRUCache } from 'lru-cache';
import { getUserProfile } from "@/db/queries/queries";
import { 
  getChatInstanceById,
  updateChatInstanceConversationPlan, 
  getChatInstanceProgress, 
  updateChatInstanceProgress,
  updateChatInstance,
  updateObjectiveProgressProgrammatically
} from "@/db/queries/chat-instances-queries";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";
import { QueryClient } from "@tanstack/react-query";
import { queryClient } from "@/components/utilities/query-provider";
import { 
  getChatResponseById, 
  updateChatResponseStatus,
  updateChatResponse
} from "@/db/queries/chat-responses-queries";
import { logger } from '@/lib/logger';

// Import the AI model configuration
import { geminiFlashModel, geminiProModel, o3MiniModel } from ".";

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

// Cache for progress prompts
const progressPromptCache = new LRUCache<string, string>({
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
async function getPopulatedThinkingHelpPrompt(userId: string | null): Promise<string> {
  try {
    // For external users, use a default thinking help prompt
    if (!userId || userId === 'external') {
      logger.debug('Loading external thinking help prompt template');
      
      // Load the thinking help prompt directly
      return fs.readFileSync(
        path.join(process.cwd(), 'agent_prompts', 'thinking_help_prompt.md'),
        'utf-8'
      );
    }
    
    const cachedPrompt = thinkingHelpPromptCache.get(userId);
    if (cachedPrompt) {
      logger.debug('Using cached thinking help prompt for user:', { userId });
      return cachedPrompt;
    }

    logger.debug('Cache miss, loading thinking help prompt for user:', { userId });
    
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'thinking_help_prompt.md'),
      'utf-8'
    );

    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    const populatedPrompt = promptTemplate
      .replace('{first_name}', profile.firstName || '')
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    thinkingHelpPromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating thinking help prompt:', error);
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

// Function to get populated progress prompt
async function getPopulatedProgressPrompt(
  organizationName: string,
  organizationContext: string,
  conversationPlan: any
): Promise<string> {
  try {
    const cacheKey = `progress-${organizationName}-${organizationContext}-${JSON.stringify(conversationPlan)}`;
    const cachedPrompt = progressPromptCache.get(cacheKey);
    if (cachedPrompt) {
      return cachedPrompt;
    }

    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'objective_update_prompt.md'),
      'utf-8'
    );

    const populatedPrompt = promptTemplate
      .replace('{organization_name}', organizationName)
      .replace('{organization_context}', organizationContext)
      .replace('{conversation_plan}', JSON.stringify(conversationPlan, null, 2));

    progressPromptCache.set(cacheKey, populatedPrompt);
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating progress prompt:', error);
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

// Export function to invalidate progress prompt cache
export function invalidateProgressPromptCache(key: string) {
  progressPromptCache.delete(key);
}

import type { ConversationPlan } from "@/components/conversationPlanSchema";

// export async function generateConversationPlan({ messages, userId, chatId }: { messages: CoreMessage[], userId: string, chatId: string }) {
//   // This function follows separation of concerns:
//   // 1. It generates structured data (the conversation plan)
//   // 2. The UI rendering is handled separately by the ConversationPlan component
//   // 3. This prevents duplication between AI text responses and UI elements
  
//   const systemPrompt = await getPopulatedConversationPlanPrompt(userId);
  
//   console.log('\n=== CONVERSATION PLAN GENERATION REQUEST ===');
//   console.log('System Prompt:', systemPrompt);
//   console.log('Messages:', messages.map(m => ({
//     role: m.role,
//     content: m.content
//   })));
//   console.log('==========================================\n');

//   // Add retry logic for the generateObject call
//   const maxRetries = 3;
//   let retryCount = 0;
//   let lastError: any = null;

//   while (retryCount < maxRetries) {
//     try {
//       const { object: rawPlan } = await generateObject({
//         model: o3MiniModel,
//         system: `${systemPrompt}

// IMPORTANT: Generate only the plan data. Do not include any instructions or explanations about the plan in your response.
// The plan will be displayed automatically by the UI.

// CRITICAL CONSTRAINTS:
// 1. Keep all objective text fields under 500 characters
// 2. Keep all other text fields under 200 characters
// 3. Do not include markdown formatting in any field
// 4. Do not include explanations or meta-commentary in any field
// 5. Ensure all arrays have at least one item
// 6. IMPORTANT: You MUST include a 'keyLearningOutcome' for each objective`,
//         prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
//         schema: z.object({
//           title: z.string().describe("Jargon-free title with key context"),
//           duration: z.string().describe("Estimate using User input (e.g., '3 minutes', '≈2', '2')"),
//           summary: z.string().describe("1-sentence purpose statement with strategic value"),
//           objectives: z.array(
//             z.object({
//               objective: z.string().describe("Active-verb focus area"),
//               keyLearningOutcome: z.string().describe("Decision-driving insight"),
//               focusPoints: z.array(z.string()).describe("List of focus points for the objective"),
//               guidanceForAgent: z.array(z.string()).describe("Tips for conducting the conversation, including tool suggestions"),
//               illustrativePrompts: z.array(z.string()).describe("Contextually relevant questions (adapt as needed)"),
//               expectedConversationTurns: z.string().describe("Expected number of conversation turns")
//             })
//           ).describe("Time-aware objectives sorted by priority")
//         }),
//       });

//       // Validate that we have at least one objective
//       if (!rawPlan || !rawPlan.objectives || rawPlan.objectives.length === 0) {
//         throw new Error("Generated plan must have at least one objective");
//       }

//       // Transform the raw plan to match our schema
//       const plan: ConversationPlan = {
//         title: rawPlan.title,
//         duration: rawPlan.duration,
//         summary: rawPlan.summary,
//         objectives: rawPlan.objectives.map(obj => ({
//           objective: obj.objective || "Untitled Objective",
//           keyLearningOutcome: obj.keyLearningOutcome || "Key insight to be gained",
//           focusPoints: Array.isArray(obj.focusPoints) ? obj.focusPoints : [],
//           guidanceForAgent: Array.isArray(obj.guidanceForAgent) ? obj.guidanceForAgent : ["Guide the conversation naturally"],
//           illustrativePrompts: Array.isArray(obj.illustrativePrompts) ? obj.illustrativePrompts : ["What are your thoughts on this?"],
//           expectedConversationTurns: obj.expectedConversationTurns || "1"
//         }))
//       };

//       try {
//         // Save the conversation plan
//         await updateChatInstanceConversationPlan(chatId, plan);
//       } catch (error) {
//         console.error('Failed to save conversation plan:', error);
//         // Continue even if save fails - don't block the response
//       }

//       console.log('\n=== CONVERSATION PLAN GENERATION RESPONSE ===');
//       console.log('Generated Plan:', JSON.stringify(plan, null, 2));
//       console.log('============================================\n');

//       return plan;
//     } catch (error) {
//       lastError = error;
//       console.error(`Conversation plan generation attempt ${retryCount + 1} failed:`, error);
//       retryCount++;
      
//       // If we've reached max retries, throw the last error
//       if (retryCount >= maxRetries) {
//         logger.error('All conversation plan generation attempts failed:', lastError);
//         throw new Error('Failed to generate conversation plan after multiple attempts');
//       }
      
//       // Wait before retrying (exponential backoff)
//       await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
//     }
//   }

//   // This should never be reached due to the throw in the catch block above
//   throw lastError;
// }

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

export async function generateDisplayOptions({ 
  text, 
  context, 
  systemPrompt, 
  messagesHistory 
}: { 
  text: string; 
  context?: string; 
  systemPrompt?: string;
  messagesHistory?: {role: string; content: string}[];
}) {
  // This function follows separation of concerns:
  // 1. It generates data only (options)
  // 2. The UI rendering is handled separately by the OptionButtons component
  // 3. This prevents duplication between AI text responses and UI elements

  // Load the default prompt if not provided
  if (!systemPrompt) {
    try {
      systemPrompt = loadPrompt('multi_choice.md');
    } catch (error) {
      logger.error('Failed to load multi_choice prompt, using fallback', error);
      systemPrompt = "Generate multiple-choice options based on the query. Keep options concise and relevant.";
    }
  }

  logger.debug('Generating display options - INPUT:', {
    text,
    textLength: text.length,
    context: context ? `${context.substring(0, 50)}...` : undefined,
    hasMessagesHistory: !!messagesHistory,
    messagesCount: messagesHistory?.length || 0
  });

  // Build the prompt based on available inputs
  const promptText = [
    // Add the current query with context
    `Generate options for: ${text}`,
    context ? `Context: ${context}` : ''
  ].filter(Boolean).join('\n');

  const { object: options } = await generateObject({
    model: geminiFlashModel,
    // Use the system prompt for detailed instructions
    system: systemPrompt,
    // If message history is provided, use it; otherwise just use the promptText
    prompt: messagesHistory ? 
      [...messagesHistory.map(m => `${m.role}: ${m.content}`).join('\n'), '\n---\n', promptText].join('\n') : 
      promptText,
    schema: z.object({
      options: z.array(z.string()).describe("Array of short, clickable options to display"),
      type: z.literal("options").describe("Type of display")
    }),
  });

  const result = {
    options: options.options,
    type: "options" as const
  };

  logger.debug('Generating display options - OUTPUT:', {
    options: result.options,
    optionsCount: result.options.length,
    contextProvided: !!context,
    historyProvided: !!messagesHistory
  });

  return result;
}

export async function thinkingHelp({ messages, userId }: { messages: CoreMessage[], userId: string | null }) {
  try {
    // Use external for non-authenticated users
    const effectiveUserId = userId || 'external';
    const systemPrompt = await getPopulatedThinkingHelpPrompt(effectiveUserId);
    
    logger.debug('Starting thinking help generation:', { userId });
    
    // Log the input to the AI model
    logger.api('Thinking help input:', {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length
    });
    
    const { object: { text } } = await generateObject({
      model: geminiFlashModel,
      system: systemPrompt,
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
      schema: z.object({
        text: z.string().describe("The thinking help guidance text")
      }),
    });

    // Log the output from the AI model
    logger.api('Thinking help output:', {
      textLength: text.length,
      text
    });

    return text;
  } catch (error) {
    logger.error('Error in thinking help:', error);
    return "Unable to provide thinking guidance.";
  }
}

export async function objectiveUpdate({ messages, userId, chatId }: { 
  messages: CoreMessage[], 
  userId: string,
  chatId: string
}) {
  try {
    logger.debug('Starting objective update:', { chatId, userId });
    
    // Get the populated prompt which already contains the hardcoded objectives
    const systemPrompt = await getPopulatedObjectiveUpdatePrompt(userId);
    
    // Get current progress for context only
    const chat = await getChatInstanceById(chatId);
    const currentProgress = chat?.objectiveProgress;
    
    // Add current progress to prompt if available
    const contextMessage = currentProgress ? 
      `Current objectives state:\n${JSON.stringify(currentProgress, null, 2)}\n\n` : 
      '';
    
    const promptMessages = [
      ...messages,
      {
        role: 'system' as const,
        content: `${contextMessage}Please analyze the conversation progress based on the objectives in the prompt and the conversation history.
Provide a concise update in the format specified in the prompt.`
      }
    ];

    // Log the input to the AI model
    logger.api('Objective update input:', {
      messageCount: promptMessages.length,
      systemPromptLength: systemPrompt.length,
      currentProgress
    });

    // Generate text response
    const { text: progressUpdate } = await generateText({
      model: geminiFlashModel,
      system: systemPrompt,
      prompt: promptMessages.map(m => `${m.role}: ${m.content}`).join('\n'),
    });

    // Log the output from the AI model
    logger.api('Objective update output:', {
      progressUpdateLength: progressUpdate.length,
      progressUpdate
    });

    return progressUpdate;
  } catch (error) {
    logger.error('Error in objective update:', error);
    return "Error generating objective update.";
  }
}

export async function updateChatProgress({ 
  messages, 
  chatResponseId,
  chatInstanceId,
  organizationName,
  organizationContext,
  initialProgress = null,
  objectiveUpdateText = null
}: { 
  messages: any[],
  chatResponseId: string,
  chatInstanceId: string,
  organizationName: string,
  organizationContext: string,
  initialProgress?: any,
  objectiveUpdateText?: string | null
}) {
  try {
    logger.info('Starting updateChatProgress', { 
      chatResponseId, 
      chatInstanceId,
      messageCount: messages.length,
      hasInitialProgress: !!initialProgress,
      hasObjectiveUpdateText: !!objectiveUpdateText,
      objectiveUpdateTextLength: objectiveUpdateText ? objectiveUpdateText.length : 0
    });
    
    // Get chat instance for conversation plan
    const chatInstance = await getChatInstanceById(chatInstanceId);
    if (!chatInstance) {
      throw new Error('Chat instance not found');
    }
    
    logger.debug('Retrieved chat instance', { 
      chatInstanceId,
      hasConversationPlan: !!chatInstance.conversationPlan,
      hasObjectiveProgress: !!chatInstance.objectiveProgress,
      objectiveProgressPreview: chatInstance.objectiveProgress 
        ? JSON.stringify(chatInstance.objectiveProgress).substring(0, 100) + '...' 
        : 'None'
    });

    // Get current chat response
    const chatResponse = await getChatResponseById(chatResponseId);
    if (!chatResponse) {
      throw new Error('Chat response not found');
    }
    
    logger.debug('Retrieved chat response', { 
      chatResponseId,
      status: chatResponse.status,
      completionStatus: chatResponse.completionStatus,
      hasChatProgress: !!chatResponse.chatProgress,
      chatProgressPreview: chatResponse.chatProgress 
        ? (typeof chatResponse.chatProgress === 'string' 
          ? chatResponse.chatProgress.substring(0, 100) + '...' 
          : JSON.stringify(chatResponse.chatProgress).substring(0, 100) + '...')
        : 'None'
    });

    // Get system prompt for progress evaluation
    const systemPrompt = await getPopulatedProgressPrompt(
      organizationName,
      organizationContext,
      chatInstance.conversationPlan
    );
    
    logger.debug('Retrieved populated progress prompt', { 
      promptLength: systemPrompt.length,
      promptPreview: systemPrompt.substring(0, 100) + '...'
    });

    // Add initial progress and objective update to the prompt if available
    let promptWithProgress = systemPrompt;
    if (initialProgress) {
      promptWithProgress += `\n\nCurrent progress state:\n${JSON.stringify(initialProgress, null, 2)}`;
      logger.debug('Added initial progress to prompt');
    }
    if (objectiveUpdateText) {
      promptWithProgress += `\n\nObjective update analysis:\n${objectiveUpdateText}`;
      logger.debug('Added objective update text to prompt');
    }
    
    logger.debug('Generating progress update with AI model', {
      finalPromptLength: promptWithProgress.length,
      messageCount: messages.length
    });

    const aiStart = performance.now();
    const { object: progressUpdate } = await generateObject({
      model: geminiFlashModel,
      system: promptWithProgress,
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
      schema: z.object({
        status: z.enum(["not_started", "in_progress", "completed"]).describe("Current status of the chat"),
        completionStatus: z.enum(["not_started", "in_progress", "completed"]).describe("Overall completion status"),
        progress: z.number().min(0).max(100).describe("Percentage of conversation completed"),
        currentObjective: z.string().describe("Current objective being discussed"),
        completedObjectives: z.array(z.string()).describe("List of completed objectives"),
        nextObjective: z.string().optional().describe("Next objective to discuss"),
        summary: z.string().describe("Brief summary of progress")
      })
    });
    const aiEnd = performance.now();
    
    logger.info('AI generated progress update', { 
      duration: `${(aiEnd - aiStart).toFixed(2)}ms`,
      status: progressUpdate.status,
      completionStatus: progressUpdate.completionStatus,
      progress: progressUpdate.progress,
      currentObjective: progressUpdate.currentObjective,
      completedObjectivesCount: progressUpdate.completedObjectives.length,
      completedObjectives: progressUpdate.completedObjectives,
      summary: progressUpdate.summary
    });

    // Create or update the progress object
    let chatProgress = initialProgress;
    
    // If no initial progress was provided, try to get it from the chat response
    if (!chatProgress && chatResponse.chatProgress) {
      try {
        // Ensure we're parsing a string, not an object
        const chatProgressStr = typeof chatResponse.chatProgress === 'string' 
          ? chatResponse.chatProgress 
          : JSON.stringify(chatResponse.chatProgress);
        
        chatProgress = JSON.parse(chatProgressStr);
        logger.debug('Using existing chat progress from chat response', {
          source: 'chatResponse.chatProgress',
          progressPreview: JSON.stringify(chatProgress).substring(0, 100) + '...'
        });
      } catch (e) {
        logger.error('Error parsing existing chat progress:', e);
        // Don't initialize with default structure here, we'll check objectiveProgress next
      }
    }
    
    // If we still don't have progress data, initialize from chat instance's objectiveProgress
    if (!chatProgress) {
      if (chatInstance.objectiveProgress) {
        // Use the chat instance's objectiveProgress as the initial structure
        chatProgress = chatInstance.objectiveProgress;
        logger.info('Initializing chat progress from chat instance objectiveProgress', {
          source: 'chatInstance.objectiveProgress',
          progressPreview: JSON.stringify(chatProgress).substring(0, 100) + '...'
        });
      } else {
        // Fall back to default structure only if objectiveProgress is not defined
        logger.info('No objectiveProgress found, using default structure');
        chatProgress = {
          objectives: {
            objective01: { status: "current" },
            objective02: { status: "tbc" },
            objective03: { status: "tbc" },
            objective04: { status: "tbc" }
          }
        };
      }
    }
    
    logger.debug('Progress object before updates', {
      objectiveCount: Object.keys(chatProgress.objectives).length,
      objectives: Object.entries(chatProgress.objectives).map(([key, objValue]) => {
        const obj = objValue as { status: string };
        return {
          key,
          status: obj.status
        };
      })
    });
    
    // Update the progress based on completed objectives
    if (progressUpdate.completedObjectives.length > 0) {
      logger.debug('Updating objectives based on completedObjectives', {
        completedObjectives: progressUpdate.completedObjectives
      });
      
      // Mark completed objectives as "done"
      for (const [key, obj] of Object.entries(chatProgress.objectives)) {
        // Check if this objective is in the completed list
        // We're using a simple heuristic: if the objective key (e.g., "objective01") 
        // is mentioned in any of the completed objectives, mark it as done
        const isCompleted = progressUpdate.completedObjectives.some(
          (objective: string) => objective.toLowerCase().includes(key.toLowerCase())
        );
        
        if (isCompleted) {
          logger.debug(`Marking objective ${key} as done`);
          chatProgress.objectives[key].status = "done";
        }
      }
      
      // Find the current objective based on progressUpdate.currentObjective
      for (const [key, obj] of Object.entries(chatProgress.objectives)) {
        // If this objective is mentioned in currentObjective, mark it as current
        if (progressUpdate.currentObjective.toLowerCase().includes(key.toLowerCase())) {
          logger.debug(`Marking objective ${key} as current`);
          chatProgress.objectives[key].status = "current";
        }
      }
    } else {
      logger.debug('No completed objectives to update');
    }
    
    logger.debug('Progress object after updates', {
      objectiveCount: Object.keys(chatProgress.objectives).length,
      objectives: Object.entries(chatProgress.objectives).map(([key, objValue]) => {
        const obj = objValue as { status: string };
        return {
          key,
          status: obj.status
        };
      })
    });

    // Update chat response status and progress
    logger.info('Saving updated progress to database', {
      chatResponseId,
      status: progressUpdate.status,
      completionStatus: progressUpdate.completionStatus,
      progressJson: JSON.stringify(chatProgress).substring(0, 100) + '...'
    });
    
    await updateChatResponse(chatResponseId, {
      status: progressUpdate.status,
      completionStatus: progressUpdate.completionStatus,
      chatProgress: JSON.stringify(chatProgress) // Save the updated progress
    });
    
    logger.info('Chat progress updated successfully');

    return progressUpdate;
  } catch (error) {
    logger.error('Error updating chat progress:', error);
    throw error;
  }
}

/**
 * Updates the progress bar based on objective updater outputs
 * This runs separately from the objective updater to maintain separation of concerns
 */
export async function progressBarUpdate({
  messages,
  chatId
}: {
  messages: CoreMessage[];
  chatId: string;
}): Promise<void> {
  try {
    logger.debug('Starting progress bar update:', { chatId });
    
    // Get current progress from database
    const chat = await getChatResponseById(chatId);
    if (!chat) {
      logger.error('Chat response not found:', { chatId });
      return;
    }
    
    // Initialize progress if it doesn't exist
    let objectiveProgress: ObjectiveProgress | null = null;
    
    // Try to parse the chat_progress field
    if (chat.chatProgress) {
      try {
        // Handle different types of chatProgress (could be string or object)
        let chatProgressStr: string;
        
        if (typeof chat.chatProgress === 'string') {
          chatProgressStr = chat.chatProgress;
        } else {
          // If it's already an object, stringify it
          chatProgressStr = JSON.stringify(chat.chatProgress);
        }
        
        // Now parse the string
        objectiveProgress = JSON.parse(chatProgressStr) as ObjectiveProgress;
        logger.debug('Successfully parsed chat progress');
      } catch (e) {
        logger.error('Error parsing chat progress:', e);
      }
    }
    
    // If no progress exists, get it from the chat instance
    if (!objectiveProgress) {
      // Get the chat instance to access objectiveProgress
      const chatInstance = await getChatInstanceById(chat.chatInstanceId);
      
      if (chatInstance && chatInstance.objectiveProgress) {
        objectiveProgress = chatInstance.objectiveProgress as ObjectiveProgress;
        logger.debug('Using objectiveProgress from chat instance');
      } else {
        // Create default progress structure if nothing exists
        objectiveProgress = {
          objectives: {
            objective01: { status: "current" },
            objective02: { status: "tbc" },
            objective03: { status: "tbc" },
            objective04: { status: "tbc" }
          }
        };
      }
    }
    
    // Extract objective updater outputs from messages
    const objectiveUpdates = messages
      .filter(m => {
        const metadata = m.experimental_providerMetadata?.metadata;
        return metadata && metadata.type === 'objective-update';
      })
      .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content));
    
    if (objectiveUpdates.length === 0) {
      logger.debug('No objective updates found, skipping progress bar update');
      return;
    }
    
    // Load the progress bar updater prompt
    const prompt = loadPrompt('progress_bar_updater.md');
    
    // Clean up the current progress object to ensure it doesn't have comments
    const cleanProgress: ObjectiveProgress = {
      objectives: {}
    };
    
    // Copy only the status field from each objective
    for (const [key, obj] of Object.entries(objectiveProgress.objectives)) {
      cleanProgress.objectives[key] = { status: obj.status };
    }
    
    // Prepare input for the AI model
    const input = {
      objectiveUpdaterHistory: objectiveUpdates,
      currentObjectiveProgress: cleanProgress
    };
    
    logger.api('Progress update input:', {
      objectiveUpdaterHistory: objectiveUpdates,
      currentObjectiveProgress: cleanProgress
    });
    
    // Generate updates using the AI model
    const { object: updates } = await generateObject({
      model: geminiFlashModel,
      prompt: `${prompt}\n\nInput:\n${JSON.stringify(input, null, 2)}`,
      schema: z.array(
        z.object({
          path: z.string().describe("Path to the field to update"),
          value: z.string().describe("New value for the field")
        })
      ),
    });
    
    logger.api('Generated progress updates:', { updates });
    
    // Apply updates to the progress object
    if (updates.length > 0) {
      // Apply each update to the progress object
      for (const update of updates) {
        const pathParts = update.path.split('.');
        if (pathParts.length !== 3 || pathParts[0] !== 'objectives' || pathParts[2] !== 'status') {
          logger.debug('Invalid update path:', update.path);
          continue;
        }
        
        const objectiveKey = pathParts[1];
        
        // Apply the update
        if (!objectiveProgress.objectives[objectiveKey]) {
          objectiveProgress.objectives[objectiveKey] = { status: 'tbc' };
        }
        
        objectiveProgress.objectives[objectiveKey].status = update.value as "done" | "current" | "tbc";
      }
      
      // Handle "next objective" logic - if an objective is marked as "done",
      // find the next "tbc" objective and mark it as "current"
      const objectiveKeys = Object.keys(objectiveProgress.objectives).sort();
      let hasCurrentObjective = false;
      
      // First check if there's already a "current" objective
      for (const key of objectiveKeys) {
        if (objectiveProgress.objectives[key].status === "current") {
          hasCurrentObjective = true;
          break;
        }
      }
      
      // If there's no "current" objective, find the first "tbc" and make it "current"
      if (!hasCurrentObjective) {
        for (const key of objectiveKeys) {
          if (objectiveProgress.objectives[key].status === "tbc") {
            objectiveProgress.objectives[key].status = "current";
            break;
          }
        }
      }
      
      // Save the updated progress
      await updateChatResponse(chatId, { 
        chatProgress: JSON.stringify(objectiveProgress) 
      });
      
      logger.info('Progress bar updated successfully:', { 
        chatId, 
        updates,
        updatedProgress: objectiveProgress
      });
    } else {
      logger.debug('No progress updates needed');
    }
  } catch (error) {
    logger.error('Error in progress bar update:', error);
  }
}

// Add this function to your file
export async function collectUserDetails({ text }: { text: string }) {
  try {
    logger.debug('Collecting user details with prompt:', { text });
    
    return {
      type: "user-details-form",
      text: text || "Please share your details with us",
      formType: "name-email"
    };
  } catch (error) {
    logger.error('Error in collectUserDetails:', error);
    throw error;
  }
}

// Add this function to your file
function loadPrompt(filename: string): string {
  const promptPath = path.join(process.cwd(), 'agent_prompts', filename);
  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error(`Error loading prompt file: ${filename}`, error);
    throw new Error(`Failed to load prompt file: ${filename}`);
  }
}
