/**
 * AI Actions Module
 * 
 * This file contains all the AI-powered functions used throughout the application.
 * These functions handle various tasks like web searching, generating display options,
 * updating progress, and providing guidance to users.
 * 
 * The module uses caching mechanisms to improve performance and reduce unnecessary API calls.
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

/**
 * Cache Systems
 * 
 * These cache systems store frequently used prompts to improve performance.
 * Each cache is designed to avoid repeatedly loading the same prompt templates
 * from disk or rebuilding the same prompt with user information.
 * 
 * This significantly reduces response times for users.
 */

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

/**
 * Gets a personalized conversation plan prompt for a specific user
 * 
 * This function retrieves or creates a conversation plan prompt tailored to the user.
 * It first checks if a cached version exists to avoid unnecessary processing.
 * If no cached version exists, it loads the template and replaces placeholder values
 * with the user's specific information from their profile.
 * 
 * @param userId - The unique identifier for the user
 * @returns A promise that resolves to the populated prompt string
 */
async function getPopulatedConversationPlanPrompt(userId: string): Promise<string> {
  try {
    // Check cache first
    const cachedPrompt = conversationPlanPromptCache.get(userId);
    if (cachedPrompt) {
      return cachedPrompt; // Use cached version if available
    }

    // Load the prompt template from a file
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'conversation_plan_agent_prompt.md'),
      'utf-8'
    );

    // Get user profile data to personalize the prompt
    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace template variables with actual values from the user's profile
    const populatedPrompt = promptTemplate
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    // Cache the result for future use
    conversationPlanPromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    console.error('Error populating conversation plan prompt:', error);
    throw error;
  }
}

/**
 * Gets a personalized thinking help prompt for a specific user
 * 
 * This function creates guidance prompts that help users think through their problems.
 * For external (non-logged in) users, it uses a default template.
 * For registered users, it personalizes the prompt with their information.
 * 
 * The function includes caching to improve performance for repeat users.
 * 
 * @param userId - The unique identifier for the user, or null for external users
 * @returns A promise that resolves to the populated prompt string
 */
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
    
    // Check if we already have a cached version for this user
    const cachedPrompt = thinkingHelpPromptCache.get(userId);
    if (cachedPrompt) {
      logger.debug('Using cached thinking help prompt for user:', { userId });
      return cachedPrompt;
    }

    logger.debug('Cache miss, loading thinking help prompt for user:', { userId });
    
    // Load the base template from disk
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'thinking_help_prompt.md'),
      'utf-8'
    );

    // Get the user's profile information to personalize the prompt
    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace placeholder text with the user's actual information
    const populatedPrompt = promptTemplate
      .replace('{first_name}', profile.firstName || '')
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    // Store in cache for future use
    thinkingHelpPromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating thinking help prompt:', error);
    throw error;
  }
}

/**
 * Gets a personalized objective update prompt for a specific user
 * 
 * This function creates prompts that help track progress toward conversation objectives.
 * It personalizes the prompts with organization-specific information.
 * The function employs caching to improve performance for repeat users.
 * 
 * @param userId - The unique identifier for the user
 * @returns A promise that resolves to the populated prompt string
 */
async function getPopulatedObjectiveUpdatePrompt(userId: string): Promise<string> {
  try {
    // Check cache first to avoid unnecessary processing
    const cachedPrompt = objectiveUpdatePromptCache.get(userId);
    if (cachedPrompt) {
      return cachedPrompt;
    }

    // Load the prompt template from disk
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'objective_update_prompt.md'),
      'utf-8'
    );

    // Get user profile data for personalization
    const profile = await getUserProfile({ userId });
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Replace placeholder values with actual user data
    const populatedPrompt = promptTemplate
      .replace('{organisation_name}', profile.organisationName || '')
      .replace('{organisation_description}', profile.organisationDescription || '');

    // Cache the result for future requests
    objectiveUpdatePromptCache.set(userId, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    console.error('Error populating objective update prompt:', error);
    throw error;
  }
}

/**
 * Gets a personalized progress prompt based on organization and conversation details
 * 
 * This function creates prompts that help track progress toward conversation objectives.
 * It combines organization information with the current conversation plan.
 * 
 * The function uses caching to improve performance and reduce redundant operations.
 * 
 * @param organizationName - The name of the user's organization
 * @param organizationContext - Additional context about the organization
 * @param conversationPlan - The current plan for the conversation
 * @returns A promise that resolves to the populated prompt string
 */
async function getPopulatedProgressPrompt(
  organizationName: string,
  organizationContext: string,
  conversationPlan: any
): Promise<string> {
  try {
    // Create a unique cache key based on all input parameters
    const cacheKey = `progress-${organizationName}-${organizationContext}-${JSON.stringify(conversationPlan)}`;
    const cachedPrompt = progressPromptCache.get(cacheKey);
    if (cachedPrompt) {
      return cachedPrompt; // Use cached version if available
    }

    // Load the base template from disk
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'objective_update_prompt.md'),
      'utf-8'
    );

    // Replace placeholder values with actual information
    const populatedPrompt = promptTemplate
      .replace('{organization_name}', organizationName)
      .replace('{organization_context}', organizationContext)
      .replace('{conversation_plan}', JSON.stringify(conversationPlan, null, 2));

    // Cache the result for future use
    progressPromptCache.set(cacheKey, populatedPrompt);
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating progress prompt:', error);
    throw error;
  }
}

/**
 * Removes a user's conversation plan prompt from the cache
 * 
 * This function is used when user data changes and we need to ensure
 * they get a fresh prompt with their updated information on their next request.
 * 
 * @param userId - The unique identifier for the user whose cache should be cleared
 */
export function invalidateConversationPlanPromptCache(userId: string) {
  conversationPlanPromptCache.delete(userId);
}

/**
 * Removes a user's thinking help prompt from the cache
 * 
 * This function is used when user data changes and we need to ensure
 * they get a fresh thinking help prompt with their updated information.
 * 
 * @param userId - The unique identifier for the user whose cache should be cleared
 */
export function invalidateThinkingHelpPromptCache(userId: string) {
  thinkingHelpPromptCache.delete(userId);
}

/**
 * Removes a user's objective update prompt from the cache
 * 
 * This function is used when user data changes and we need to ensure
 * they get a fresh objective update prompt with their updated information.
 * 
 * @param userId - The unique identifier for the user whose cache should be cleared
 */
export function invalidateObjectiveUpdatePromptCache(userId: string) {
  objectiveUpdatePromptCache.delete(userId);
}

/**
 * Removes a progress prompt from the cache using its unique key
 * 
 * This function is used when organization data or conversation plans change
 * and we need to ensure fresh prompts are generated.
 * 
 * @param key - The unique cache key for the prompt that should be cleared
 */
export function invalidateProgressPromptCache(key: string) {
  progressPromptCache.delete(key);
}

import type { ConversationPlan } from "@/components/conversationPlanSchema";

/**
 * Performs a web search using an AI-optimized search engine
 * 
 * This function connects to the Tavily search API to find relevant information
 * on the web based on the user's query. It returns both a direct answer and
 * supporting search results with their sources.
 * 
 * The search is optimized for AI applications and provides context for further processing.
 * 
 * @param query - The search query from the user
 * @returns Search results including an AI-generated answer and supporting web pages
 */
export async function performWebSearch({ query }: { query: string }) {
  try {
    // Initialize Tavily client with our API key
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    
    // Use searchQNA for AI-optimized responses with a direct answer
    const results = await tvly.search(query, {
      searchDepth: "basic", // Basic depth is faster but less comprehensive
      includeAnswer: true,  // Generate an AI answer from the search results
      maxResults: 3         // Limit to 3 results for conciseness
    });
    
    // Return formatted results including the answer and supporting sources
    return {
      answer: results.answer,  // AI-generated answer to the query
      results: results.results.map(result => ({
        title: result.title,   // Title of the webpage
        url: result.url,       // URL of the source
        content: result.content, // Relevant content from the page
        score: result.score    // Relevance score
      })),
      responseTime: results.responseTime // How long the search took
    };
  } catch (error) {
    console.error('Tavily search failed:', error);
    throw error;
  }
}

/**
 * Generates multiple-choice options for user interaction
 * 
 * This function creates clickable options that users can select from based on their query.
 * It uses AI to analyze the query and generate relevant, contextual options.
 * 
 * The function separates the data generation from UI rendering to maintain clean architecture.
 * 
 * @param text - The user's query or text input
 * @param context - Optional additional context to help generate better options
 * @param systemPrompt - Optional custom prompt for the AI model
 * @param messagesHistory - Optional conversation history for better context
 * @returns Object containing generated options for display in the UI
 */
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

  // Load the default prompt if not provided by the caller
  if (!systemPrompt) {
    try {
      systemPrompt = loadPrompt('multi_choice.md');
    } catch (error) {
      logger.error('Failed to load multi_choice prompt, using fallback', error);
      systemPrompt = "Generate multiple-choice options based on the query. Keep options concise and relevant.";
    }
  }

  // Log input parameters for debugging
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

  // Call AI model to generate the options
  const { object: options } = await generateObject({
    model: geminiFlashModel, // Use a faster model for better user experience
    // Use the system prompt for detailed instructions
    system: systemPrompt,
    // If message history is provided, use it; otherwise just use the promptText
    prompt: messagesHistory ? 
      [...messagesHistory.map(m => `${m.role}: ${m.content}`).join('\n'), '\n---\n', promptText].join('\n') : 
      promptText,
    // Define the expected response format using Zod schema
    schema: z.object({
      options: z.array(z.string()).describe("Array of short, clickable options to display"),
      type: z.literal("options").describe("Type of display")
    }),
  });

  // Format the result for the UI
  const result = {
    options: options.options,
    type: "options" as const
  };

  // Log the generated options for debugging
  logger.debug('Generating display options - OUTPUT:', {
    options: result.options,
    optionsCount: result.options.length,
    contextProvided: !!context,
    historyProvided: !!messagesHistory
  });

  return result;
}

/**
 * Provides AI-powered thinking guidance to help users solve problems
 * 
 * This function analyzes the conversation and generates helpful guidance
 * to assist users in thinking through their challenges. It personalizes
 * the guidance based on whether the user is logged in or not.
 * 
 * The thinking help acts like a coach that guides users toward their goals.
 * 
 * @param messages - The conversation history so far
 * @param userId - The user's ID, or null for external/anonymous users
 * @returns A text string containing thinking guidance for the user
 */
export async function thinkingHelp({ messages, userId }: { messages: CoreMessage[], userId: string | null }) {
  try {
    // Use 'external' for non-authenticated users to get a generic prompt
    const effectiveUserId = userId || 'external';
    const systemPrompt = await getPopulatedThinkingHelpPrompt(effectiveUserId);
    
    logger.debug('Starting thinking help generation:', { userId });
    
    // Log the input to the AI model for debugging
    logger.api('Thinking help input:', {
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length
    });
    
    // Generate the thinking help text using the AI model
    const { object: { text } } = await generateObject({
      model: geminiFlashModel, // Use a faster model for better user experience
      system: systemPrompt,    // Use personalized system prompt
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'), // Convert messages to string format
      schema: z.object({
        text: z.string().describe("The thinking help guidance text")
      }),
    });

    // Log the output from the AI model for debugging
    logger.api('Thinking help output:', {
      textLength: text.length,
      text
    });

    return text;
  } catch (error) {
    logger.error('Error in thinking help:', error);
    return "Unable to provide thinking guidance."; // Fallback message on error
  }
}

/**
 * Updates objectives based on conversation progress
 * 
 * This function analyzes the conversation and generates a text update
 * describing progress toward predefined objectives. It helps track
 * what has been accomplished and what still needs to be addressed.
 * 
 * The updates are personalized for the user's organization context.
 * 
 * @param messages - The conversation history so far
 * @param userId - The user's unique identifier
 * @param chatId - The ID of the current chat session
 * @returns A text string describing progress toward objectives
 */
export async function objectiveUpdate({ messages, userId, chatId }: { 
  messages: CoreMessage[], 
  userId: string,
  chatId: string
}) {
  try {
    logger.debug('Starting objective update:', { chatId, userId });
    
    // Get the populated prompt which already contains the hardcoded objectives
    const systemPrompt = await getPopulatedObjectiveUpdatePrompt(userId);
    
    // Get current progress to provide context to the AI
    const chat = await getChatInstanceById(chatId);
    const currentProgress = chat?.objectiveProgress;
    
    // Add current progress to prompt if available
    const contextMessage = currentProgress ? 
      `Current objectives state:\n${JSON.stringify(currentProgress, null, 2)}\n\n` : 
      '';
    
    // Combine messages with additional system guidance
    const promptMessages = [
      ...messages,
      {
        role: 'system' as const,
        content: `${contextMessage}Please analyze the conversation progress based on the objectives in the prompt and the conversation history.
Provide a concise update in the format specified in the prompt.`
      }
    ];

    // Log the input to the AI model for debugging
    logger.api('Objective update input:', {
      messageCount: promptMessages.length,
      systemPromptLength: systemPrompt.length,
      currentProgress
    });

    // Add detailed debug logging of the full request structure
    console.log('\n=== FULL REQUEST STRUCTURE ===');
    console.log('1. System Prompt:');
    console.log(systemPrompt);
    console.log('\n2. Prompt Messages:');
    promptMessages.forEach((msg, i) => {
      console.log(`\nMessage ${i + 1}:`);
      console.log(`Role: ${msg.role}`);
      console.log(`Content: ${msg.content}`);
    });
    console.log('\n3. Final Formatted Prompt:');
    console.log(promptMessages.map(m => `${m.role}: ${m.content}`).join('\n'));
    console.log('\n=== END REQUEST STRUCTURE ===\n');

    // Generate text response analyzing progress toward objectives
    const { text: progressUpdate } = await generateText({
      model: geminiFlashModel,
      system: systemPrompt,
      prompt: promptMessages.map(m => `${m.role}: ${m.content}`).join('\n'),
    });

    // Log the output from the AI model for debugging
    logger.api('Objective update output:', {
      progressUpdateLength: progressUpdate.length,
      progressUpdate
    });

    return progressUpdate;
  } catch (error) {
    logger.error('Error in objective update:', error);
    return "Error generating objective update."; // Fallback message on error
  }
}

/**
 * Updates the progress bar based on objective updater outputs
 * 
 * This function analyzes messages for progress updates and modifies
 * the progress tracking accordingly. It runs separately from the objective
 * updater to maintain separation of concerns between generating updates
 * and applying them to the UI.
 * 
 * The function uses AI to interpret objective updater outputs and convert
 * them into specific progress status changes.
 * 
 * @param messages - The conversation messages to analyze
 * @param chatId - The ID of the chat to update
 * @returns A promise that resolves when the update is complete
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
          overall_turns: 0,
          expected_total_min: 4,
          expected_total_max: 12,
          objectives: {
            objective01: { 
              status: "current",
              turns_used: 0,
              expected_min: 1,
              expected_max: 3
            },
            objective02: { 
              status: "tbc",
              turns_used: 0,
              expected_min: 1,
              expected_max: 3
            },
            objective03: { 
              status: "tbc",
              turns_used: 0,
              expected_min: 1,
              expected_max: 3
            },
            objective04: { 
              status: "tbc",
              turns_used: 0,
              expected_min: 1,
              expected_max: 3
            }
          }
        };
      }
    }

    // Count turns (user-assistant pairs)
    const messageGroups = messages.reduce((acc, msg) => {
      if (msg.role === 'user') {
        acc.push([msg]);
      } else if (acc.length > 0 && (msg.role === 'assistant' || msg.role === 'tool')) {
        acc[acc.length - 1].push(msg);
      }
      return acc;
    }, [] as CoreMessage[][]);

    const turnCount = messageGroups.length;
    
    // Update turn counts
    objectiveProgress.overall_turns = turnCount;
    
    // Find current objective and update its turns
    const currentObjectiveKey = Object.entries(objectiveProgress.objectives)
      .find(([_, obj]) => obj.status === "current")?.[0];
    
    if (currentObjectiveKey) {
      objectiveProgress.objectives[currentObjectiveKey].turns_used = turnCount;
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
      overall_turns: objectiveProgress.overall_turns,
      expected_total_min: objectiveProgress.expected_total_min,
      expected_total_max: objectiveProgress.expected_total_max,
      objectives: {}
    };
    
    // Copy only the status field from each objective
    for (const [key, obj] of Object.entries(objectiveProgress.objectives)) {
      cleanProgress.objectives[key] = { 
        status: obj.status,
        turns_used: obj.turns_used,
        expected_min: obj.expected_min,
        expected_max: obj.expected_max
      };
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
          objectiveProgress.objectives[objectiveKey] = { 
            status: 'tbc',
            turns_used: 0,
            expected_min: 1,
            expected_max: 3
          };
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
      
      // Add detailed logging of the final progress state
      console.log('\n=== PROGRESS BAR UPDATE FINAL STATE ===');
      console.log('Chat ID:', chatId);
      console.log('\nOverall Progress:');
      console.log('- Total Turns:', objectiveProgress.overall_turns);
      console.log('- Expected Total:', `${objectiveProgress.expected_total_min}-${objectiveProgress.expected_total_max} turns`);
      console.log('\nObjectives Status:');
      Object.entries(objectiveProgress.objectives).forEach(([key, obj]) => {
        console.log(`\n${key}:`);
        console.log(`- Status: ${obj.status}`);
        console.log(`- Turns Used: ${obj.turns_used}`);
        console.log(`- Expected Range: ${obj.expected_min}-${obj.expected_max} turns`);
      });
      console.log('\n=== END PROGRESS BAR UPDATE ===\n');
      
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

/**
 * Collects user details through a form interface
 * 
 * This function creates a prompt for users to share their information
 * through a form. It's designed to gather basic information like name
 * and email in a user-friendly way.
 * 
 * @param text - The prompt text to display to the user
 * @returns An object that defines the form display configuration
 */
export async function collectUserDetails({ text }: { text: string }) {
  try {
    logger.debug('Collecting user details with prompt:', { text });
    
    // Return a form configuration object
    return {
      type: "user-details-form", // Type of UI component to display
      text: text || "Please share your details with us", // Text prompt for the user
      formType: "name-email" // Form fields to include
    };
  } catch (error) {
    logger.error('Error in collectUserDetails:', error);
    throw error;
  }
}

/**
 * Loads a prompt file from the filesystem
 * 
 * This utility function reads prompt templates from the file system.
 * It's used throughout the application to load various prompt templates
 * for different AI functions.
 * 
 * @param filename - The name of the prompt file to load
 * @returns The contents of the prompt file as a string
 */
function loadPrompt(filename: string): string {
  const promptPath = path.join(process.cwd(), 'agent_prompts', filename);
  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error(`Error loading prompt file: ${filename}`, error);
    throw new Error(`Failed to load prompt file: ${filename}`);
  }
}

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

async function createObjectiveProgressFromPlan(plan: ConversationPlan, chatId: string): Promise<ObjectiveProgress> {
  // Extract the number of objectives from the plan
  const objectiveCount = plan.objectives.length;
  
  // Calculate totals and create progress object
  let totalMin = 0;
  let totalMax = 0;
  
  const objectiveProgress: ObjectiveProgress = {
    overall_turns: 0,
    expected_total_min: 0,
    expected_total_max: 0,
    objectives: {}
  };
  
  // Populate the objectives with the correct status and turn expectations
  plan.objectives.forEach((objective, index) => {
    const { min, max } = parseTurnExpectation(objective.expectedConversationTurns);
    const paddedIndex = String(index + 1).padStart(2, '0');
    const objectiveKey = `objective${paddedIndex}`;
    
    objectiveProgress.objectives[objectiveKey] = {
      status: index === 0 ? "current" : "tbc",
      turns_used: 0,
      expected_min: min,
      expected_max: max
    };
    
    totalMin += min;
    totalMax += max;
  });
  
  // Set the total expected turns
  objectiveProgress.expected_total_min = totalMin;
  objectiveProgress.expected_total_max = totalMax;
  
  logger.debug('Creating objective progress:', {
    chatId,
    planObjectiveCount: objectiveCount,
    expectedTotalMin: totalMin,
    expectedTotalMax: totalMax
  });
  
  // Save the objective progress to the database
  await updateChatInstanceProgress(chatId, objectiveProgress);
  
  return objectiveProgress;
}
