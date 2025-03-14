/**
 * Chat API Route Handler
 * 
 * This file manages all chat-related API endpoints:
 * - POST: Process new messages and tool executions
 * - DELETE: Remove chat histories
 * 
 * Data Flow (POST):
 * 1. Client request → Message content
 * 2. AI Processing → Gemini Pro model
 * 3. Tool Execution → Various tools (weather, flights, etc.)
 * 4. Stream Response → Real-time updates
 * 5. Save Chat → Database storage
 *  
 * Security:
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
import { o3MiniLowModel, geminiFlashModel } from "@/ai_folder";  // AI model configuration
import {
  performWebSearch,
  thinkingHelp,
  objectiveUpdate,
  invalidateConversationPlanPromptCache,
  progressBarUpdate,
  generateDisplayOptions
} from "@/ai_folder/actions";  // Flight-related utility functions
import {
  getChatInstanceById
} from "@/db/queries/chat-instances-queries";
import { 
  getChatResponseById,
  updateChatResponse
} from "@/db/queries/chat-responses-queries";
import { getProfile } from "@/db/queries/profiles-queries";
import { generateUUID } from "@/lib/utils";  // Utility functions
import { logger } from '@/lib/logger';
import { 
  populatePromptCache, 
  invalidatePromptCache as invalidateCache,
  invalidateAllPromptCaches as invalidateAllCaches,
  getCachedPrompt
} from '@/lib/prompt-cache';

// Remove exports and use internal functions instead
function _invalidatePromptCache(orgId: string) {
  logger.debug('Invalidating prompt caches for organization:', { orgId });
  invalidateCache(orgId);
  invalidateConversationPlanPromptCache(orgId);
}

function _invalidateAllPromptCaches() {
  logger.debug('Invalidating all prompt caches');
  invalidateAllCaches();
}

// Add diagnostic logging to track cache status
console.log("INIT: External chat module loaded");
// We'll use the shared prompt cache instead of a separate cache

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
     *    - chatInstanceId: ID of the parent chat instance
     *    - chatResponseId: ID of the current chat response
     *    - organizationName and organizationContext: for prompt generation
     *    - warmupOnly flag indicates this is just a prompt cache warmup request
     * 
     * 2. Log incoming messages:
     *    - Truncates long messages for readability
     *    - Logs message roles and content lengths
     *    - Helps with debugging and monitoring
     */
    // Add better error handling for JSON parsing
    let requestData;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return new Response(JSON.stringify({ error: "Empty request body" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      requestData = JSON.parse(text);
    } catch (parseError) {
      logger.error(`JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const { 
      messages, 
      id = generateUUID(), 
      chatInstanceId, 
      chatResponseId, 
      organizationName = "", 
      organizationContext = "",
      warmupOnly = false  // Special flag for cache warming
    } = requestData;
    
    // Handle warmup requests differently
    if (warmupOnly) {
      logger.info(`Processing prompt cache warmup request for: ${organizationName}`);
      
      try {
        // Use the shared utility function to populate the cache
        // This is more reliable than the previous approach
        const prompt = await populatePromptCache(chatInstanceId);
        
        // Return success without running AI
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Prompt cache warmed successfully",
          promptLength: prompt.length,
          timestamp: new Date().toISOString()
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error warming prompt cache: ${errorMessage}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Failed to warm prompt cache",
          message: errorMessage
        }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    // For normal requests, continue with standard processing
    // We'll use our own caching logic here to bypass the user-based invalidation
    
    // Use the shared prompt cache utility instead of a separate cache
    // This ensures we're using a single source of truth for prompt caching
    
    console.log(`PROMPT CHECK: Looking for cached prompt for org: "${organizationName}" and id: "${chatInstanceId}"`);
    
    // Get the cached prompt or generate a new one
    let systemPrompt = getCachedPrompt(chatInstanceId, organizationName || 'default');
    
    if (!systemPrompt) {
      console.log(`PROMPT CACHE MISS: No cached prompt found, generating new prompt`);
      logger.info(`External chat cache miss for: ${organizationName || 'default'}`);
      
      // Use populatePromptCache which now stores with both key formats
      systemPrompt = await populatePromptCache(chatInstanceId);
      console.log(`PROMPT POPULATED: Generated new prompt of ${systemPrompt.length} chars`);
    } else {
      console.log(`PROMPT CACHE HIT: Found cached prompt of ${systemPrompt.length} chars`);
      logger.info(`Using external chat cached prompt for: ${organizationName || 'default'}`);
    }

    // // Detailed request logging
    // console.log('\n=== CHAT REQUEST DETAILS ===');
    // console.log('Request ID:', id);
    // console.log('Chat Instance ID:', chatInstanceId);
    // console.log('Chat Response ID:', chatResponseId);
    // console.log('\nMessages:');
    // messages.forEach((msg: Message, index: number) => {
    //   console.log(`\n[Message ${index + 1}]`);
    //   console.log('Role:', msg.role);
    //   console.log('Content:', msg.content);
    //   if (msg.toolInvocations) {
    //     console.log('Tool Invocations:', JSON.stringify(msg.toolInvocations, null, 2));
    //   }
    // });
    // console.log('\nSystem Prompt:');
    // console.log(systemPrompt);
    // console.log('\n=== END REQUEST DETAILS ===\n');

    // Use api logger instead of ai logger for API request details
    logger.api('Incoming messages:', {
      id,
      chatInstanceId,
      chatResponseId,
      messages: messages.map((m: Message) => ({
        role: m.role,
        contentLength: m.content.length,
        content: m.content
      }))
    });

    // logger.info('Processing chat request:', { id, chatResponseId, messageCount: messages.length });

    // Verify the chat response exists
    if (!chatResponseId) {
      logger.error('Missing chatResponseId in request');
      return new Response("Missing chatResponseId parameter", { status: 400 });
    }

    const chatResponse = await getChatResponseById(chatResponseId);
    if (!chatResponse) {
      logger.error('Chat response not found', { chatResponseId });
      return new Response("Chat response not found", { status: 404 });
    }

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
    
    // Use api logger for processed messages
    logger.api('Processed messages:', {
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
    const result = await streamText({
      model: geminiFlashModel,
      system: systemPrompt,
      messages: coreMessages,


      tools: {
        endConversation: {
          description: "- **Description:** Concludes the interaction by redirecting the user to their dashboard, where they can review and edit the conversation plan. - **When to Use:** This tool is mandatory at the conversation's end when all objectives are met or when the user has no further input. It is highlighted within the final objective of the conversation plan.",
          parameters: z.object({
            // Required dummy parameter to satisfy Gemini's schema requirements
            _dummy: z.string().optional().describe("Placeholder parameter")
          }),
          execute: async () => {
            try {
              logger.info('Executing endConversation tool, finalizing conversation', { chatResponseId });
              
              // Call the finalize endpoint
              const finalizeResponse = await fetch(new URL('/api/external-chat/finalize', request.url).toString(), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chatResponseId }),
              });
              
              if (!finalizeResponse.ok) {
                // Log the error but continue with the redirect
                const errorData = await finalizeResponse.json().catch(() => ({}));
                logger.error('Failed to finalize conversation', { 
                  status: finalizeResponse.status,
                  error: errorData
                });
              } else {
                logger.info('Conversation finalized successfully');
              }
            } catch (error) {
              // Log the error but continue with the redirect
              logger.error('Error calling finalize endpoint:', error);
            }
            
            return {
              message: "It's been awesome working together - redirecting you now!",
              redirectUrl: `/chat/external/${id}/finish`,
              delayMs: 3000
            };
          },
        },

        
        searchWeb: {
          description: "A tool to perform a web search, gathering factual information from publicly available sources like product specifications. Ideal for filling information gaps. **When to Use:** Use when there's a need for verified data or when the conversation lacks key details. Not to be overused and should be considered only if the specific objective suggests this tool.",
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


        displayOptionsMultipleChoice: {
          description: `
        - **Purpose:** Presents the user with contextually relevant, clickable options for selecting one or more choices based on the conversation context.  
        - **When to Use:** DO NOT USE as the first turn in the conversation. Only use if suggested in the current objective.
        - **Context Parameter:** Use the optional context parameter to provide additional information that will help generate more relevant and tailored options.
          `,
          parameters: z.object({
            text: z.string().describe("The question or statement for which to generate selectable options"),
            context: z.string().optional().describe("Additional context to help generate more relevant options")
          }),
          execute: async ({ text, context }) => {
            try {
              logger.debug('Executing displayOptionsMultipleChoice tool', { 
                text, 
                contextProvided: !!context
              });
              
              // Use recent messages from conversation history automatically
              // This simplifies the API by handling it internally
              const recentMessages = coreMessages.slice(-5).map(m => ({
                role: m.role,
                content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
              }));
              
              const result = await generateDisplayOptions({ 
                text, 
                context,
                // Use default system prompt
                messagesHistory: recentMessages
              });
              
              logger.debug('displayOptionsMultipleChoice result:', { 
                options: result.options,
                optionsCount: result.options.length
              });
              
              return {
                type: "options",
                options: result.options
              };
            } catch (error) {
              logger.error('Error in displayOptionsMultipleChoice tool:', error);
              throw error;
            }
          },
        },


        thinkingHelp: {
          description: `The ThinkPad tool allows Franko to pause and reflect internally when faced with a complex or ambiguous situation in a customer research interview. 
          It analyzes the current challenge based on the user's last response and the full conversation history, considers multiple conversational moves, and selects the best approach for the next turn. 
          The output is for Franko's internal use only and is not shared with the user; the main agent handles crafting the actual response. 
          **When to use:** Franko should use the ThinkPad tool at his discretion in these specific situations:

        - **Vague or unclear user responses:** When the user's answer lacks detail or clarity (e.g., "It's fine," "Maybe," or "I'm not sure").
        - **Complex user questions:** When the user asks a question with multiple possible interpretations or layers (e.g., "How should I improve my entire workflow?").
        - **Multiple conversational paths: When the conversation could reasonably go in several directions, and Franko needs to choose the most effective one (e.g., deepening the current topic, shifting focus, or clarifying).
        - **Critical decision points:** When the next move could significantly impact the conversation's direction or the quality of insights gathered (e.g., transitioning to a new objective or addressing a sensitive topic).
        - **Uncertainty about the next step:** When Franko feels unsure about the best way to proceed or needs to weigh the pros and cons of different approaches.

        **Usage Notes**
        - Discretionary Use: Use the ThinkPad sparingly, only when the conversation's complexity or ambiguity warrants deeper reflection.
        - Internal Only: The analysis is hidden from the user and used within a multi-step turn to inform Franko's decision-making.
        - Supports Main Agent: The Chosen Path guides the main agent in constructing the final response, leveraging its training in response style.`,
          parameters: z.object({
            _dummy: z.string().optional().describe("Placeholder parameter - not used")
          }),
          execute: async () => {
            logger.debug('Executing thinking help tool');
            
            const result = await thinkingHelp({ 
              messages: coreMessages,
              userId: chatResponse.userId // Use userId from chatResponse
            });
            
            logger.api('Thinking help tool result:', {
              resultLength: result.length,
              result: result.substring(0, 100) + (result.length > 100 ? '...' : '') // Log first 100 chars
            });
            
            return {
              type: 'internal-guidance',
              text: result,
              experimental_providerMetadata: {
                metadata: {
                  type: 'internal-guidance',
                  isVisible: false
                }
              }
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

          // Get existing chat response
          const existingChatResponse = await getChatResponseById(chatResponseId);
          if (!existingChatResponse) {
            logger.error('Chat response not found for updating messages', { chatResponseId });
            return;
          }
          
          // Parse existing messages from messagesJson
          const existingMessages = existingChatResponse.messagesJson ? 
            JSON.parse(existingChatResponse.messagesJson) : 
            [];
            
            // Find the latest user message from coreMessages
            const latestUserMessage = [...coreMessages]
              .filter(m => m.role === 'user')
              .pop();
            
            // Check if this user message is already saved
            const userMessageExists = existingMessages.some((m: { role: string; content: string }) => 
              m.role === 'user' && 
              m.content === latestUserMessage?.content
            );
            
            // Create the updated message array
            const allMessages = [...existingMessages];
            
            // Add the user message if it's not already saved
            if (latestUserMessage && !userMessageExists) {
              allMessages.push({
                id: generateUUID(),
                role: latestUserMessage.role,
                content: latestUserMessage.content
              });
            }
            
            // Add the AI response messages
            allMessages.push(...newProcessedMessages);

            // Immediately update chat with current messages
          await updateChatResponse(chatResponseId, {
            messagesJson: JSON.stringify(allMessages),
            });

            // Non-blocking objective update
            Promise.resolve().then(async () => {
              try {
                logger.debug('Starting objective update process');
                
                // Get the chat instance to ensure we have the latest progress structure
                const chatInstance = await getChatInstanceById(chatInstanceId);
                if (!chatInstance || !chatInstance.objectiveProgress) {
                  logger.error('Chat instance or objectiveProgress not found', { 
                    chatInstanceId, 
                    hasInstance: !!chatInstance, 
                    hasProgress: !!(chatInstance && chatInstance.objectiveProgress) 
                  });
                  return;
                }
                
                // Ensure the chat response has the latest progress structure
                // This ensures the chat_progress field is properly initialized
                if (!chatResponse.chatProgress) {
                  logger.debug('Initializing chatProgress in chat response', { chatResponseId });
                  await updateChatResponse(chatResponseId, {
                    chatProgress: chatInstance.objectiveProgress
                  });
                }
                
                // CRITICAL FIX: Use chatResponseId instead of chatInstanceId for objectiveUpdate
                // objectiveUpdate function expects chatId to be a chat response ID, not a chat instance ID
                const objectiveResult = await objectiveUpdate({
                  messages: coreMessages,
                  userId: chatResponse.userId,
                  chatId: chatResponseId  // Changed from chatInstanceId to chatResponseId
                });

                // logger.api('Objective update result in route handler:', {
                //   resultLength: objectiveResult.length,
                //   result: objectiveResult
                // });

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

              // Update chat response with all messages including objective update
              await updateChatResponse(chatResponseId, {
                messagesJson: JSON.stringify(allMessages),
                });

                // logger.debug('Objective update message added to chat history');

                // After objective update is complete, update progress bar (non-blocking)
                Promise.resolve().then(async () => {
                  try {
                    // Pass all messages including the new objective update
                    await progressBarUpdate({
                      messages: [...coreMessages, objectiveMessage as unknown as CoreMessage],
                    chatId: chatResponseId
                    });
                  } catch (error) {
                    logger.error('Failed to update progress bar:', error);
                  }
                });
              } catch (error) {
                logger.error('Failed to process objective update:', error);
              }
            });

          logger.info('Chat updated successfully:', { chatResponseId });
          } catch (error) {
          logger.error('Failed to update chat:', { error, chatResponseId });
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
      chatResponseId,
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });

    // Return streaming response
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    // Improved error logging with better error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Error processing chat request: ${errorMessage}`);
    
    if (errorStack) {
      logger.debug(`Error stack: ${errorStack}`);
    }
    
    // Return a helpful error response instead of throwing
    return new Response(JSON.stringify({
      error: "Failed to process chat request",
      message: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * The DELETE handler has been removed as external users don't need to delete chat histories
 */

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

