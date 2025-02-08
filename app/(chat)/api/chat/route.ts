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
  
  // Import custom modules and functions
  import { geminiProModel } from "@/ai_folder";  // AI model configuration
  import {
    performWebSearch,
    generateConversationPlan,
    generateDisplayOptions,
  } from "@/ai_folder/actions";  // Flight-related utility functions
  import { auth } from "@clerk/nextjs/server";  // Authentication utilities
  import {
    deleteChatById,
    getChatById,
    saveChat,
  } from "@/db/queries/queries";  // Database operations
  import { generateUUID } from "@/lib/utils";  // Utility functions
  import { logger } from '@/lib/logger';
  
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
          content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
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
          content: typeof m.content === 'string' ? m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '') : ''
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
        model: geminiProModel,
        system: loadPrompt('creator_prompt.md'),
        messages: coreMessages,


        tools: {
          endConversation: {
            description: "A tool that ends the conversation by redirecting the Creator back to their dashboard, where they can review and edit the final Interview Guide and access additional details like the shareable link. Use this tool immediately after the interview wrap-up when all objectives have been met or when the Creator indicates no further input is needed.",
            parameters: z.object({
              // Required dummy parameter to satisfy Gemini's schema requirements
              _dummy: z.string().optional().describe("Placeholder parameter")
            }),
            execute: async () => ({
              message: "Thank you for using our flight booking service. Have a great day!",
              redirectUrl: "https://www.google.com",
              delayMs: 3000
            }),
          },
  
          
          searchWeb: {
            description: "A tool that performs a web search to gather factual context from publicly available sources (such as product descriptions, documentation, or feature specs) when key details are missing from the Creator's input, when automating context retrieval is desired, or when external, verifiable data is needed to inform an Interview Guide. Avoid using it if all necessary information is already provided, if the data is private or sensitive, or if the request is purely subjective.",
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
            description: "A tool that creates an Interview Guide tailored to the Creator's specific needs and context by outlining objectives, suggesting questions, and structuring the interview flow. Use this tool once sufficient details have been gathered (such as conversation type and duration) or when the Creator explicitly requests a structured plan for their interview process.",
            parameters: z.object({
              _dummy: z.string().optional().describe("Placeholder parameter")
            }),
            execute: async () => {
              // We have access to coreMessages here from the outer scope
              const plan = await generateConversationPlan({ messages: coreMessages });
              return plan;
            },
          },
  

          displayOptions: {
            description: "Display clickable options for the user to choose from",
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
              // Log message details for debugging
              // Shows both existing messages and new AI responses
              logger.debug('Processing messages for save:', {
                coreMessages: coreMessages.map(m => ({
                  role: m.role,
                  contentType: typeof m.content,
                  preview: typeof m.content === 'string' ? m.content.substring(0, 50) : 'complex content'
                })),
                responseMessages: responseMessages.map(m => ({
                  role: m.role,
                  contentType: typeof m.content,
                  preview: typeof m.content === 'string' ? m.content.substring(0, 50) : 'complex content'
                }))
              });
  
              // Combine previous messages with new responses and format them
              const formattedMessages = [...coreMessages, ...responseMessages]
                // First filter: Remove empty string messages but keep complex objects
                .filter(m => {
                  if (typeof m.content === 'string') {
                    return m.content.trim().length > 0;
                  }
                  return true;
                })
                // Transform each message into a consistent format
                .map((m): FormattedMessage | null => {
                  try {
                    // Validate message has acceptable role
                    if (!['user', 'assistant', 'tool', 'system'].includes(m.role)) {
                      return null;
                    }
  
                    // Generate a unique ID for each message
                    const messageId = generateUUID();
  
                    // Fast path for simple user messages
                    if (m.role === 'user' && typeof m.content === 'string') {
                      return {
                        id: messageId,
                        role: 'user',
                        content: m.content.trim()
                      };
                    }
  
                    let content: string | null = null;
  
                    // Handle different content types (array, string, object)
                    if (Array.isArray(m.content)) {
                      const parts: string[] = [];
  
                      for (const item of m.content) {
                        // Handle string items directly
                        if (typeof item === 'string') {
                          parts.push(item);
                          continue;
                        }
  
                        // Skip invalid items
                        if (!item || typeof item !== 'object') continue;
  
                        // Extract text content if available
                        if ('text' in item && item.text?.trim()) {
                          parts.push(item.text);
                        }
  
                        // Handle special content types
                        if ('type' in item) {
                          // Skip raw tool calls
                          if (item.type === 'tool-call') continue;
  
                          // Process tool results
                          if (item.type === 'tool-result' && item.result) {
                            if (item.toolName === 'displayOptions') {
                              // Special handling for displayOptions tool
                              const result = item.result as { display: string[], text: string };
                              parts.push(result.text);
                              parts.push(result.display.map(opt => `- ${opt}`).join('\n'));
                            } else {
                              // Default tool result handling
                              parts.push(JSON.stringify(item.result));
                            }
                          }
                        }
                      }
  
                      // Join all parts with newlines
                      content = parts
                        .filter(part => part && part.trim().length > 0)
                        .join('\n');
  
                      // Fallback if no valid content was extracted
                      if (!content || content.trim().length === 0) {
                        content = JSON.stringify(m.content);
                      }
                    } else if (typeof m.content === 'string') {
                      // Handle simple string content
                      content = m.content.trim();
                    } else if (m.content && typeof m.content === 'object') {
                      // Handle object content by stringifying
                      content = JSON.stringify(m.content);
                    }
  
                    // Last resort fallback
                    if (!content || content.trim().length === 0) {
                      content = JSON.stringify(m);
                    }
  
                    // Skip if still no valid content
                    if (!content || content.trim().length === 0) return null;
  
                    return {
                      id: messageId,
                      role: m.role as MessageRole,
                      content
                    };
                  } catch (error) {
                    // Log formatting errors but don't break processing
                    logger.error('Error formatting message:', { error, message: m });
                    return null;
                  }
                })
                // Final filter: Ensure all messages are valid and properly formatted
                .filter((m): m is FormattedMessage => {
                  return m !== null && 
                         ['user', 'assistant', 'tool', 'system'].includes(m.role) &&
                         typeof m.content === 'string' && 
                         m.content.trim().length > 0;
                });
  
              // Log the final formatted messages for debugging
              logger.debug('Pre-save message format:', {
                messageCount: formattedMessages.length,
                messages: formattedMessages.map(m => ({
                  role: m.role,
                  contentPreview: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
                }))
              });
  
              // Additional logging before save
              logger.debug('Final formatted messages:', {
                messageCount: formattedMessages.length,
                messages: formattedMessages.map(m => ({
                  role: m.role,
                  contentPreview: m.content.substring(0, 100),
                  contentLength: m.content.length,
                  isUserMessage: m.role === 'user'
                }))
              });
  
              // Save to database if we have valid messages
              if (formattedMessages.length > 0) {
                logger.debug('Saving chat with messages:', {
                  id,
                  userId,
                  messageCount: formattedMessages.length,
                  lastMessage: formattedMessages[formattedMessages.length - 1]
                });
                
                await saveChat({
                  id,
                  messages: formattedMessages,
                  userId,
                });
                logger.info('Chat saved successfully:', { id });
              } else {
                logger.info('No valid messages to save:', { id });
              }
            } catch (error) {
              // Log error but don't throw to prevent breaking the stream
              logger.error('Failed to save chat:', { error, messages: coreMessages });
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
      // Extract chat ID from URL parameters
          /**
       * Step 1: Extract Chat ID
       * 
       * Example URL: /api/chat?id=123
       * Parses URL parameters to get chat ID
       * Returns 404 if ID is missing
       */
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
  
      if (!id) {
        return new Response("Not Found", { status: 404 });
      }
  
      /**
       * Step 2: Authentication Check
       * 
       * Verifies user is logged in
       * Returns 401 if not authenticated
       */
  
      // Verify user authentication
      const { userId } = await auth();
      if (!userId) {
        return new Response("Unauthorized", { status: 401 });
      }
  
      try {
        // Verify chat ownership and delete
              /**
         * Step 3: Ownership Verification
         * 
         * 1. Fetch chat details from database
         * 2. Compare chat's userId with current user
         * 3. Return 401 if user doesn't own chat
         */
  
        const chat = await getChatById({ id });
        logger.info('Found chat to delete:', { id, userId: chat.userId });
        
        if (chat.userId !== userId) {
          logger.error('Unauthorized delete attempt:', { 
            chatUserId: chat.userId, 
            requestUserId: userId 
          });
          return new Response("Unauthorized", { status: 401 });
        }
  
          /**
         * Step 4: Delete Chat
         * 
         * Removes chat from database
         * Returns success response
         */
  
        await deleteChatById({ id });
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

