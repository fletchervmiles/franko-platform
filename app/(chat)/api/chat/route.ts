/**
 * Chat API Route Handler
 * 
 * This file manages all chat-related API endpoints:
 * - POST: Process new messages and tool executions
 * - DELETE: Remove chat histories
 * 
 * Data Flow (POST):
 * 1. Client request → Message content
 * 2. Auth check → User session
 * 3. AI Processing → Gemini Pro model
 * 4. Tool Execution → Various tools (weather, flights, etc.)
 * 5. Stream Response → Real-time updates
 * 6. Save Chat → Database storage
 *  
 * Security:
 * - Authentication required for all endpoints
 * - Chat ownership verification for deletions
 * - Error handling and logging
 * 
 *  * Message Format Standards:
 * 1. Simple Messages: { role: 'user' | 'assistant', content: string }
 * 2. Tool Calls: { role: 'assistant', content: [{ type: 'tool-call', ... }] }
 * 3. Tool Results: { role: 'tool', content: [{ type: 'tool-result', ... }] }
 * 
 * Tool Development Guidelines:
 * - Use Zod schema for parameter validation
 * - Include human-readable 'text' in results
 * - Keep data JSON-serializable
 * - Follow existing type patterns
 * 
 * Database Saving:
 * - Happens asynchronously after response
 * - Doesn't impact chat experience
 * - Converts all messages to consistent format
 * - Handles complex tool interactions
 */


// Import necessary dependencies
import { 
    // Converts messages between different formats (UI, database, AI model)
    convertToCoreMessages,  
    
    // Base message type that includes:
    // - id: string
    // - role: 'user' | 'assistant' | 'system' | 'tool'
    // - content: string
    // - name?: string
    Message,  
    
    // Main function for streaming AI responses
    // - Handles real-time message generation
    // - Manages tool executions
    // - Returns streamable response
    streamText,  
    
    // Core message format used internally by AI SDK
    // Simplified version of Message without UI-specific fields
    CoreMessage,  
    
    // Special message type for tool executions
    // Contains:
    // - toolName: string
    // - toolArgs: object
    // - toolResult: unknown
    CoreToolMessage,
    LanguageModelV1
  } from "ai";
  import { z } from "zod";  // Schema validation library
  import * as console from 'console';
  import fs from 'fs';
  import path from 'path';
  import { LRUCache } from 'lru-cache';
  
  // Import custom modules and functions
  import { geminiFlashModel } from "@/ai_folder";  // AI model configuration
  import {
    performWebSearch,
    generateConversationPlan,
    generateDisplayOptions,
    thinkingHelp,
    objectiveUpdate,
    invalidateConversationPlanPromptCache,
  } from "@/ai_folder/actions";  // Flight-related utility functions
  import { auth } from "@clerk/nextjs/server";  // Authentication utilities
  import {
    deleteChatInstance,
    getChatInstanceById,
    updateChatInstance,
  } from "@/db/queries/chat-instances-queries";
  import { getProfile } from "@/db/queries/profiles-queries";
  import { generateUUID } from "@/lib/utils";  // Utility functions
  import { logger } from '@/lib/logger';
  
  // Cache for populated prompts, keyed by userId
  const promptCache = new LRUCache<string, string>({
    max: 500, // Maximum number of items to store
    ttl: 1000 * 60 * 60, // Items expire after 1 hour
  });
  
  /**
   * Invalidates the cached prompt for a specific user
   * Call this whenever a user's profile is updated
   */
  export function invalidatePromptCache(userId: string) {
    logger.debug('Invalidating prompt caches for user:', { userId });
    promptCache.delete(userId);
    invalidateConversationPlanPromptCache(userId);
  }
  
  /**
   * Invalidates the entire prompt cache
   * Use this for global updates or migrations
   */
  export function invalidateAllPromptCaches() {
    logger.debug('Invalidating all prompt caches');
    promptCache.clear();
  }
  
  // Add this function near the top of your file
  function loadPrompt(filename: string): string {
    // Adjust path to be relative to the project root
    const promptPath = path.join(process.cwd(), 'agent_prompts', filename);
    // Add error handling
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      console.error(`Error loading prompt file: ${filename}`, error);
      throw new Error(`Failed to load prompt file: ${filename}`);
    }
  }
  
  // Add this function to populate the prompt template
  async function getPopulatedPrompt(userId: string): Promise<string> {
    try {
      const cachedPrompt = promptCache.get(userId);
      if (cachedPrompt) {
        logger.debug('Using cached prompt for user:', { userId });
        return cachedPrompt;
      }

      logger.debug('Cache miss, loading prompt for user:', { userId });
      
      const promptTemplate = fs.readFileSync(
        path.join(process.cwd(), 'agent_prompts', 'user_assistant_prompt.md'),
        'utf-8'
      );

      const profile = await getProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const populatedPrompt = promptTemplate
        .replace('{first_name}', profile.firstName || '')
        .replace('{organisation_name}', profile.organisationName || '')
        .replace('{organisation_description}', profile.organisationDescription || '');

      promptCache.set(userId, populatedPrompt);
      
      return populatedPrompt;
    } catch (error) {
      logger.error('Error populating prompt:', error);
      throw error;
    }
  }
  
  /**
   * Message Type Definitions
   * 
   * These types define the structure of messages flowing through the chat system:
   * - How messages are received from the client
   * - How they're processed by tools
   * - How they're stored in the database
   */
  
  // Defines all possible roles in the chat system
  type MessageRole = 'user' | 'assistant' | 'tool' | 'system';
  
  /**
   * ChatMessage Interface
   * 
   * Represents a message in its raw form, supporting multiple content types:
   * 1. Simple string messages (e.g., user text input)
   * 2. Complex tool interactions (array of actions/results)
   * 3. Generic objects (Record<string, unknown>)
   * 
   * Example Tool Message:
   * {
   *   role: 'tool',
   *   content: [{
   *     type: 'tool-call',
   *     text: 'Checking weather...',
   *     args: { location: 'London' },
   *     result: { temp: 20, condition: 'sunny' }
   *   }]
   * }
   */
  interface ChatMessage {
    role: MessageRole;
    content: string | Array<{
      type?: string;      // Identifies content type (e.g., 'tool-call', 'tool-result')
      text?: string;      // Human-readable message
      args?: unknown;     // Tool arguments
      result?: unknown;   // Tool execution results
    }> | Record<string, unknown>;
  }
  
  /**
   * FormattedMessage Interface
   * 
   * Simplified version of ChatMessage for storage and display:
   * - Always has string content
   * - Used for database storage
   * - Used for chat history
   * 
   * Example:
   * {
   *   role: 'assistant',
   *   content: 'The weather in London is 20°C and sunny'
   * }
   */
  interface FormattedMessage {
    id: string;
    role: MessageRole;
    content: string;
  }
  
  /**
   * POST Request Handler
   * 
   * This is the core endpoint that processes all chat interactions:
   * - Receives messages from the client
   * - Processes them through the AI model
   * - Executes tools (weather, flights, etc.)
   * - Streams responses back
   * - Saves chat history
   */
  export async function POST(request: Request) {
    const startTime = performance.now();
    logger.debug('Incoming chat request');
  
    try {
      /**
       * Message Extraction and Processing
       * 
       * 1. Extract request data:
       *    - id: unique identifier for this chat session
       *    - messages: array of all messages in the conversation
       * 
       * 2. Log incoming messages:
       *    - Truncates long messages for readability
       *    - Logs message roles and content lengths
       *    - Helps with debugging and monitoring
       */
      const { messages, id = generateUUID() } = await request.json();
      
      logger.ai('Incoming messages:', {
        id,
        messages: messages.map((m: Message) => ({
          role: m.role,
          contentLength: m.content.length,
          content: m.content
        }))
      });
  
      logger.info('Processing chat request:', { id, messageCount: messages.length });
  
      /**
       * Authentication Check
       * 
       * Verifies that:
       * - User has valid session
       * - Request is authorized
       * - User ID is available for database operations
       */
      const { userId } = await auth();
      if (!userId) {
        logger.error('Unauthorized request attempt');
        return new Response("Unauthorized", { status: 401 });
      }
      logger.info('User authenticated:', { userId });
  
      /**
       * Message Format Conversion
       * 
       * 1. Convert UI messages to core format:
       *    - Strips UI-specific fields
       *    - Prepares for AI processing
       * 
       * 2. Filter empty messages:
       *    - Removes messages with no content
       *    - Ensures clean input for AI
       * 
       * 3. Log processed messages:
       *    - Helps track any formatting issues
       *    - Validates conversion success
       */
      const coreMessages = convertToCoreMessages(messages).filter(
        (message) => message.content.length > 0,
      );
      logger.ai('Processed messages:', {
        messageCount: coreMessages.length,
        messages: coreMessages.map(m => ({
          role: m.role,
          contentLength: typeof m.content === 'string' ? m.content.length : 0,
          content: typeof m.content === 'string' ? m.content : ''
        }))
      });
  
      /**
       * AI Stream Configuration
       * 
       * Sets up the AI model with:
       * - System prompt loaded from file
       * - Message history (coreMessages)
       * - Available tools for AI to use
       * - Response streaming settings
       */
      const systemPrompt = await getPopulatedPrompt(userId);
      
      // Log the full request configuration
      logger.ai('Gemini Request Configuration:', {
        model: geminiFlashModel.toString(),
        systemPromptLength: systemPrompt.length,
        systemPrompt,
        messageCount: coreMessages.length,
        messages: coreMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const result = await streamText({
        model: geminiFlashModel,
        system: systemPrompt,
        messages: coreMessages,


        tools: {
          endConversation: {
            description: "A tool that ends the conversation by redirecting the user back to their dashboard, where they can review and edit the final conversation plan and access additional details like the shareable link. **When to use:** Use this tool immediately after the conversation has finished, when all objectives have been met or when the user indicates no further input is needed.",
            parameters: z.object({
              // Required dummy parameter to satisfy Gemini's schema requirements
              _dummy: z.string().optional().describe("Placeholder parameter")
            }),
            execute: async () => ({
              message: "It's been awesome working together - redirecting you now!",
              redirectUrl: `/conversations/${id}`,
              delayMs: 3000
            }),
          },
  
          
          searchWeb: {
            description: "A tool that performs a web search to gather factual context from publicly available sources (such as product descriptions, documentation, or feature specs). **When to use:** Use tool when key details are missing from the user's input, when automating context retrieval is desired, or when external, verifiable data is needed to inform the conversation. Avoid using it if all necessary information is already provided, if the data is private or sensitive, or if the request is purely subjective.",
            parameters: z.object({
              query: z.string().describe("The search query to find information about"),
              searchDepth: z
                .enum(["basic", "advanced"])
                .optional()
                .describe("How deep to search. Use 'advanced' for more thorough results"),
              topic: z
                .enum(["general", "news"])
                .optional()
                .describe("Category of search, use 'news' for recent events")
            }),
            execute: async ({ query, searchDepth = "basic", topic = "general" }) => {
              logger.ai('Web search tool called:', { query, searchDepth, topic });
              const results = await performWebSearch({ query });
              logger.ai('Web search results:', {
                answer: results.answer,
                resultCount: results.results.length,
                responseTime: results.responseTime
              });
              return results;
            },
          },
  

          generateConversationPlan: {
            description: "This is the most important tool in the workflow. It generates and displays the conversation plan in the UI once all relevant information has been gathered. The plan can be regenerated multiple times based on new insights or user feedback. **When to use:** Use this tool when you have gathered enough details about the user requirements to generate the first draft of the Conversation Plan.",
            parameters: z.object({
              _dummy: z.string().optional().describe("Placeholder parameter - not used")
            }),
            execute: async () => {
              try {
                // We have access to coreMessages, userId, and id from the outer scope
                logger.ai('Generating conversation plan:', { 
                  messageCount: coreMessages.length,
                  userId,
                  chatId: id
                });
                
                const plan = await generateConversationPlan({ 
                  messages: coreMessages,
                  userId,
                  chatId: id
                });

                logger.ai('Generated conversation plan:', {
                  title: plan.title,
                  duration: plan.duration,
                  objectiveCount: plan.objectives.length
                });

                const result = {
                  type: 'conversation-plan',
                  display: {
                    title: plan.title,
                    duration: plan.duration,
                    summary: plan.summary,
                    objectives: plan.objectives
                  },
                  plan // Include full plan for reference
                };

                return result;
              } catch (error) {
                logger.error('Failed to generate conversation plan:', error);
                throw error;
              }
            },
          },
  

          displayOptions: {
            description: "Display clickable options for the user to choose from. This tool generates a user interface with clickable, multiple-choice options. It enhances the user experience by presenting choices in an organized, interactive format instead of plain text. **When to use:** Use only when there is multiple options to present and showing in UI would enhance the user experience.",
            parameters: z.object({
              text: z.string().describe("Text to display above the options"),
            }),
            execute: async ({ text }) => {
              const result = await generateDisplayOptions({ text });
              return {
                type: "options",
                display: result.options,
                text: result.text
              };
            },
          },

          thinkingHelp: {
            description: "This tool helps you pause and gather your thoughts when conducting the conversation. Instead of immediately asking the next question that comes to mind, you can take a moment to reflect and jot down ideas. By doing so, you'll clarify any confusion about the next step, weigh different approaches, and ultimately choose the most effective question or statement. **When to use:** Use this tool whenever you're uncertain about how to proceed, and it will offer guidance and direction towards the optimal path for your conversation.",
            parameters: z.object({
              _dummy: z.string().optional().describe("Placeholder parameter - not used")
            }),
            execute: async () => {
              const result = await thinkingHelp({ 
                messages: coreMessages,
                userId
              });
              return {
                type: 'internal-guidance',
                text: result
              };
            },
          },
        },
  
        /**
         * onFinish Callback
         * 
         * Purpose: Save the complete chat history after AI responds
         * Triggers: After AI stream completes and all tools have executed
         * Input: responseMessages - New messages from current AI response
         */
  
        // Save chat history after completion
        onFinish: async ({ responseMessages }) => {
          if (userId) {
            try {
              // Process new messages
              const newProcessedMessages = responseMessages.map(m => {
                let content = m.content;
                
                // If it's a string, it might be wrapped in markdown and JSON
                if (typeof content === 'string') {
                  // First remove markdown wrapping if present
                  if (content.startsWith('```json\n') && content.endsWith('\n```')) {
                    content = content.slice(8, -4); // Remove ```json\n and \n```
                  }
                  
                  try {
                    // Then parse the JSON content
                    const parsed = JSON.parse(content);
                    // Use the parsed content directly - this is the actual message
                    return { ...m, content: parsed.content };
                  } catch (e) {
                    // If JSON parsing fail, use content as is
                    console.debug('Failed to parse message content as JSON:', e);
                    return { ...m, content };
                  }
                }
                
                // If it's not a string (e.g., already an array), use as is
                return { ...m, content };
              }).filter(m => {
                // Filter out objective updates from UI display
                const metadata = m.experimental_providerMetadata?.metadata;
                return !(metadata && metadata.type === 'objective-update' && metadata.isVisible === false);
              });

              // Get existing chat instance
              const existingChat = await getChatInstanceById(id);
              const existingMessages = existingChat ? JSON.parse(existingChat.messages || '[]') : [];
              
              // Combine existing and new messages
              const allMessages = [...existingMessages, ...newProcessedMessages];

              // Immediately update chat with current messages
              await updateChatInstance(id, {
                messages: JSON.stringify(allMessages),
              });

              // Non-blocking objective update
              Promise.resolve().then(async () => {
                try {
                  const objectiveResult = await objectiveUpdate({
                    messages: coreMessages,
                    userId,
                    chatId: id
                  });

                  // Create objective update message
                  const objectiveMessage = {
                    role: 'tool' as const,
                    content: objectiveResult,
                    experimental_providerMetadata: {
                      metadata: {
                        type: 'objective-update',
                        isVisible: false
                      }
                    }
                  };

                  // Add objective update to all messages
                  allMessages.push(objectiveMessage);

                  // Update chat instance with all messages including objective update
                  await updateChatInstance(id, {
                    messages: JSON.stringify(allMessages),
                  });
                } catch (error) {
                  logger.error('Failed to process objective update:', error);
                }
              });

              logger.info('Chat updated successfully:', { id });
            } catch (error) {
              logger.error('Failed to update chat:', { error, messages: coreMessages });
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
          onTelemetry: (telemetryData: any) => {
            logger.ai('AI Telemetry:', telemetryData);
          }
        } as any,
      });
  
      logger.debug('Raw model response:', {
        result: result.response,
      });
  
      // Add performance logging at the end
      const endTime = performance.now();
      logger.info('Request completed', {
        id,
        duration: `${(endTime - startTime).toFixed(2)}ms`
      });
  
      // Return streaming response
      return result.toDataStreamResponse({});
    } catch (error) {
      logger.error('Error processing chat request:', error);
      throw error;
    }
  }
  
  /**
   * DELETE Request Handler
   * 
   * Removes chat histories with security checks:
   * 1. Validates chat ID exists
   * 2. Verifies user is authenticated
   * 3. Confirms user owns the chat
   * 4. Performs deletion
   */
  
  export async function DELETE(request: Request) {
    logger.debug('Incoming delete request');
  
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
  
      if (!id) {
        return new Response("Not Found", { status: 404 });
      }
  
      const { userId } = await auth();
      if (!userId) {
        return new Response("Unauthorized", { status: 401 });
      }
  
      try {
        const chat = await getChatInstanceById(id);
        
        // Return 404 if chat doesn't exist
        if (!chat) {
          return new Response("Chat not found", { status: 404 });
        }
  
        logger.info('Found chat to delete:', { id, userId: chat.userId });
        
        if (chat.userId !== userId) {
          logger.error('Unauthorized delete attempt:', { 
            chatUserId: chat.userId, 
            requestUserId: userId 
          });
          return new Response("Unauthorized", { status: 401 });
        }
  
        await deleteChatInstance(id);
        logger.info('Chat deleted successfully:', { id });
        
        return new Response("Chat deleted", { status: 200 });
      } catch (error) {
        return new Response("An error occurred while processing your request", {
          status: 500,
        });
      }
    } catch (error) {
      logger.error('Error deleting chat:', error);
      return new Response("An error occurred while processing your request", {
        status: 500,
      });
    }
  }
  
  /**
   * Key Integration Points:
   * 
   * 1. AI Model (ai/index.ts):
   *    - Gemini Pro configuration
   *    - Response generation
   * 
   * 2. Tools (ai/actions.ts):
   *    - Tool implementations
   *    - Data generation
   * 
   * 3. Database (db/queries.ts):
   *    - Chat storage
   *    - History retrieval
   * 
   * 4. Authentication (auth.ts):
   *    - Session management
   *    - User verification
   * 
   * 5. Logging (lib/logger.ts):
   *    - Error tracking
   *    - Performance monitoring
   */
  
  /**
   * Message Format Handling Guide
   * 
   * Current Message Types:
   * 1. Simple Messages (most common)
   * {
   *   role: 'user' | 'assistant',
   *   content: string
   * }
   * 
   * 2. Tool Calls (when AI uses a tool)
   * {
   *   role: 'assistant',
   *   content: [{
   *     type: 'tool-call',
   *     toolName: string,
   *     args: object
   *   }]
   * }
   * 
   * 3. Tool Results (after tool execution)
   * {
   *   role: 'tool',
   *   content: [{
   *     type: 'tool-result',
   *     toolName: string,
   *     result: object
   *   }]
   * }
   * 
   * Guidelines for New Tools:
   * 1. Always include 'type' field in tool content
   * 2. Keep tool results JSON-serializable
   * 3. Include a 'text' field for human-readable output
   * 4. Follow existing patterns for special tools:
   *    - displayOptions: { text: string, display: string[] }
   *    - searchResults: { query: string, results: array }
   * 
   * Example of Well-Structured Tool:
   * {
   *   description: "Tool description for AI",
   *   parameters: z.object({
   *     // Zod schema defines expected inputs
   *     param1: z.string().describe("Description"),
   *   }),
   *   execute: async (args) => {
   *     // Return standardized format
   *     return {
   *       text: "Human readable result",
   *       data: { ... }, // Tool-specific data
   *     };
   *   }
   * }
   */

