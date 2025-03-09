// /**
//  * Chat API Route Handler
//  * 
//  * This file manages all chat-related API endpoints:
//  * - POST: Process new messages and tool executions
//  * - DELETE: Remove chat histories
//  * 
//  * Data Flow (POST):
//  * 1. Client request → Message content
//  * 2. Auth check → User session
//  * 3. AI Processing → Gemini Pro model
//  * 4. Tool Execution → Various tools (weather, flights, etc.)
//  * 5. Stream Response → Real-time updates
//  * 6. Save Chat → Database storage
//  *  
//  * Security:
//  * - Authentication required for all endpoints
//  * - Chat ownership verification for deletions
//  * - Error handling and logging
//  * 
//  *  * Message Format Standards:
//  * 1. Simple Messages: { role: 'user' | 'assistant', content: string }
//  * 2. Tool Calls: { role: 'assistant', content: [{ type: 'tool-call', ... }] }
//  * 3. Tool Results: { role: 'tool', content: [{ type: 'tool-result', ... }] }
//  * 
//  * Tool Development Guidelines:
//  * - Use Zod schema for parameter validation
//  * - Include human-readable 'text' in results
//  * - Keep data JSON-serializable
//  * - Follow existing type patterns
//  * 
//  * Database Saving:
//  * - Happens asynchronously after response
//  * - Doesn't impact chat experience
//  * - Converts all messages to consistent format
//  * - Handles complex tool interactions
//  */


// // Import necessary dependencies
// import { 
//     // Converts messages between different formats (UI, database, AI model)
//     convertToCoreMessages,  
    
//     // Base message type that includes:
//     // - id: string
//     // - role: 'user' | 'assistant' | 'system' | 'tool'
//     // - content: string
//     // - name?: string
//     Message,  
    
//     // Main function for streaming AI responses
//     // - Handles real-time message generation
//     // - Manages tool executions
//     // - Returns streamable response
//     streamText,  
    
//     // Core message format used internally by AI SDK
//     // Simplified version of Message without UI-specific fields
//     CoreMessage,  
    
//     // Special message type for tool executions
//     // Contains:
//     // - toolName: string
//     // - toolArgs: object
//     // - toolResult: unknown
//     CoreToolMessage,
//     LanguageModelV1
//   } from "ai";
//   import { z } from "zod";  // Schema validation library
//   import * as console from 'console';
//   import fs from 'fs';
//   import path from 'path';
//   import { LRUCache } from 'lru-cache';
  
//   // Import custom modules and functions
//   import { o3MiniLowModel, geminiFlashModel } from "@/ai_folder";  // AI model configuration
//   import {
//     performWebSearch,
//     thinkingHelp,
//     objectiveUpdate,
//     invalidateConversationPlanPromptCache,
//     progressBarUpdate,
//     collectUserDetails,
//     generateDisplayOptions
//   } from "@/ai_folder/actions";  // Flight-related utility functions
//   import { auth } from "@clerk/nextjs/server";  // Authentication utilities
//   import {
//     deleteChatInstance,
//     getChatInstanceById,
//     updateChatInstance,
//     updateChatInstanceConversationPlan
//   } from "@/db/queries/chat-instances-queries";
//   import {
//     getChatResponseById,
//     updateChatResponseMessages,
//     updateChatResponseStatus
//   } from "@/db/queries/chat-responses-queries";
//   import { getProfile } from "@/db/queries/profiles-queries";
//   import { generateUUID } from "@/lib/utils";  // Utility functions
//   import { logger } from '@/lib/logger';
  
//   // Cache for populated prompts, keyed by userId
//   const promptCache = new LRUCache<string, string>({
//     max: 500, // Maximum number of items to store
//     ttl: 1000 * 60 * 60, // Items expire after 1 hour
//   });
  
//   // Wrap cache-related functions in a namespace
//   export namespace CacheControl {
//     /**
//      * @internal
//      * Invalidates the cached prompt for a specific user
//      * Call this whenever a user's profile is updated
//      */
//     export function invalidatePromptCache(userId: string) {
//       logger.debug('Invalidating prompt caches for user:', { userId });
//       promptCache.delete(userId);
//       invalidateConversationPlanPromptCache(userId);
//     }

//     /**
//      * Invalidates the entire prompt cache
//      * Use this for global updates or migrations
//      */
//     export function invalidateAllPromptCaches() {
//       logger.debug('Invalidating all prompt caches');
//       promptCache.clear();
//     }
//   }
  
//   // Add this function near the top of your file
//   function loadPrompt(filename: string): string {
//     // Adjust path to be relative to the project root
//     const promptPath = path.join(process.cwd(), 'agent_prompts', filename);
//     // Add error handling
//     try {
//       return fs.readFileSync(promptPath, 'utf-8');
//     } catch (error) {
//       console.error(`Error loading prompt file: ${filename}`, error);
//       throw new Error(`Failed to load prompt file: ${filename}`);
//     }
//   }
  
//   // Add this function to populate the prompt template
//   async function getPopulatedPrompt(userId: string | null): Promise<string> {
//     try {
//       // For external users, use a default prompt template
//       if (!userId || userId === 'external') {
//         logger.debug('Loading external prompt template');
        
//         // Load the external chat prompt directly
//         const externalPromptTemplate = fs.readFileSync(
//           path.join(process.cwd(), 'agent_prompts', 'external_chat_prompt.md'),
//           'utf-8'
//         );
        
//         return externalPromptTemplate;
//       }
      
//       // For regular users, check the cache first
//       const cachedPrompt = promptCache.get(userId);
//       if (cachedPrompt) {
//         logger.debug('Using cached prompt for user:', { userId });
//         return cachedPrompt;
//       }

//       logger.debug('Cache miss, loading prompt for user:', { userId });
      
//       const promptTemplate = fs.readFileSync(
//         path.join(process.cwd(), 'agent_prompts', 'external_chat_prompt.md'),
//         'utf-8'
//       );

//       const profile = await getProfile(userId);
//       if (!profile) {
//         throw new Error('User profile not found');
//       }

//       const populatedPrompt = promptTemplate
//         .replace('{first_name}', profile.firstName || '')
//         .replace('{organisation_name}', profile.organisationName || '')
//         .replace('{organisation_description}', profile.organisationDescription || '');

//       promptCache.set(userId, populatedPrompt);
      
//       return populatedPrompt;
//     } catch (error) {
//       logger.error('Error populating prompt:', error);
//       throw error;
//     }
//   }
  
//   /**
//    * Message Type Definitions
//    * 
//    * These types define the structure of messages flowing through the chat system:
//    * - How messages are received from the client
//    * - How they're processed by tools
//    * - How they're stored in the database
//    */
  
//   // Defines all possible roles in the chat system
//   type MessageRole = 'user' | 'assistant' | 'tool' | 'system';
  
//   /**
//    * ChatMessage Interface
//    * 
//    * Represents a message in its raw form, supporting multiple content types:
//    * 1. Simple string messages (e.g., user text input)
//    * 2. Complex tool interactions (array of actions/results)
//    * 3. Generic objects (Record<string, unknown>)
//    * 
//    * Example Tool Message:
//    * {
//    *   role: 'tool',
//    *   content: [{
//    *     type: 'tool-call',
//    *     text: 'Checking weather...',
//    *     args: { location: 'London' },
//    *     result: { temp: 20, condition: 'sunny' }
//    *   }]
//    * }
//    */
//   interface ChatMessage {
//     role: MessageRole;
//     content: string | Array<{
//       type?: string;      // Identifies content type (e.g., 'tool-call', 'tool-result')
//       text?: string;      // Human-readable message
//       args?: unknown;     // Tool arguments
//       result?: unknown;   // Tool execution results
//     }> | Record<string, unknown>;
//   }
  
//   /**
//    * FormattedMessage Interface
//    * 
//    * Simplified version of ChatMessage for storage and display:
//    * - Always has string content
//    * - Used for database storage
//    * - Used for chat history
//    * 
//    * Example:
//    * {
//    *   role: 'assistant',
//    *   content: 'The weather in London is 20°C and sunny'
//    * }
//    */
//   interface FormattedMessage {
//     id: string;
//     role: MessageRole;
//     content: string;
//   }
  
//   /**
//    * POST Request Handler
//    * 
//    * This is the core endpoint that processes all chat interactions:
//    * - Receives messages from the client
//    * - Processes them through the AI model
//    * - Executes tools (weather, flights, etc.)
//    * - Streams responses back
//    * - Saves chat history
//    */
//   export async function POST(request: Request) {
//     const startTime = performance.now();
//     logger.debug('Incoming chat request');
  
//     try {
//       /**
//        * Message Extraction and Processing
//        * 
//        * 1. Extract request data:
//        *    - id: unique identifier for this chat session
//        *    - messages: array of all messages in the conversation
//        *    - chatInstanceId: (optional) ID of the parent chat instance for responses
//        * 
//        * 2. Log incoming messages:
//        *    - Truncates long messages for readability
//        *    - Logs message roles and content lengths
//        *    - Helps with debugging and monitoring
//        */
//       const { messages, id = generateUUID(), chatInstanceId } = await request.json();
      
//       // Use api logger instead of ai logger for API request details
//       logger.api('Incoming messages:', {
//         id,
//         chatInstanceId,
//         messages: messages.map((m: Message) => ({
//           role: m.role,
//           contentLength: m.content.length,
//           content: m.content
//         }))
//       });
  
//       logger.info('Processing chat request:', { id, messageCount: messages.length });
  
//       // If this is a public chat response (has chatInstanceId), we don't need auth
//       let userId = null;
//       if (!chatInstanceId) {
//         /**
//          * Authentication Check
//          * 
//          * Verifies that:
//          * - User has valid session
//          * - Request is authorized
//          * - User ID is available for database operations
//          */
//         const authResult = await auth();
//         userId = authResult?.userId;
//         if (!userId) {
//           logger.error('Unauthorized request attempt');
//           return new Response("Unauthorized", { status: 401 });
//         }
//         logger.info('User authenticated:', { userId });
//       }
  
//       /**
//        * Message Format Conversion
//        * 
//        * 1. Convert UI messages to core format:
//        *    - Strips UI-specific fields
//        *    - Prepares for AI processing
//        * 
//        * 2. Filter empty messages:
//        *    - Removes messages with no content
//        *    - Ensures clean input for AI
//        * 
//        * 3. Log processed messages:
//        *    - Helps track any formatting issues
//        *    - Validates conversion success
//        */
//       const coreMessages = convertToCoreMessages(messages).filter(
//         (message) => message.content.length > 0,
//       );
      
//       // Use api logger for processed messages
//       logger.api('Processed messages:', {
//         messageCount: coreMessages.length,
//         messages: coreMessages.map(m => ({
//           role: m.role,
//           contentLength: typeof m.content === 'string' ? m.content.length : 0,
//           content: typeof m.content === 'string' ? m.content : ''
//         }))
//       });
  
//       /**
//        * AI Stream Configuration
//        * 
//        * Sets up the AI model with:
//        * - System prompt loaded from file
//        * - Message history (coreMessages)
//        * - Available tools for AI to use
//        * - Response streaming settings
//        */
//       let systemPrompt;
//       try {
//         systemPrompt = await getPopulatedPrompt(userId || 'external');
//       } catch (error) {
//         logger.error('Error loading system prompt:', error);
//         // Fallback to a simple prompt if loading fails
//         systemPrompt = "You are a helpful AI assistant.";
//       }
      
//       // Wrap tool executions in try/catch to prevent streaming errors
//       const safeTools = {
//         endConversation: {
//           description: "A tool that ends the conversation by redirecting the user back to their dashboard, where they can review and edit the final conversation plan and access additional details like the shareable link. **When to use:** Use this tool immediately after the conversation has finished, when all objectives have been met or when the user indicates no further input is needed.",
//           parameters: z.object({
//             // Required dummy parameter to satisfy Gemini's schema requirements
//             _dummy: z.string().optional().describe("Placeholder parameter")
//           }),
//           execute: async () => {
//             try {
//               return {
//                 message: "It's been awesome working together - redirecting you now!",
//                 redirectUrl: `/conversations/${id}`,
//                 delayMs: 3000
//               };
//             } catch (error) {
//               logger.error('Error in endConversation tool:', error);
//               return {
//                 message: "Thanks for chatting! Redirecting now.",
//                 redirectUrl: `/conversations/${id}`,
//                 delayMs: 3000
//               };
//             }
//           },
//         },
  
        
//         searchWeb: {
//           description: "A tool that performs a web search to gather factual context from publicly available sources (such as product descriptions, documentation, or feature specs). **When to use:** Use tool when key details are missing from the user's input, when automating context retrieval is desired, or when external, verifiable data is needed to inform the conversation. Avoid using it if all necessary information is already provided, if the data is private or sensitive, or if the request is purely subjective.",
//           parameters: z.object({
//             query: z.string().describe("The search query to find information about"),
//             searchDepth: z
//               .enum(["basic", "advanced"])
//               .optional()
//               .describe("How deep to search. Use 'advanced' for more thorough results"),
//             topic: z
//               .enum(["general", "news"])
//               .optional()
//               .describe("Category of search, use 'news' for recent events")
//           }),
//           execute: async ({ query, searchDepth = "basic", topic = "general" }: { 
//             query: string; 
//             searchDepth?: "basic" | "advanced"; 
//             topic?: "general" | "news" 
//           }) => {
//             try {
//               logger.ai('Web search tool called:', { query, searchDepth, topic });
//               const results = await performWebSearch({ query });
//               logger.ai('Web search results:', {
//                 answer: results.answer,
//                 resultCount: results.results.length,
//                 responseTime: results.responseTime
//               });
//               return results;
//             } catch (error) {
//               logger.error('Error in searchWeb tool:', error);
//               return {
//                 answer: "Sorry, I couldn't perform that web search right now.",
//                 results: [],
//                 responseTime: 0
//               };
//             }
//           },
//         },
  

//         displayOptionsMultipleChoice: {
//           description: `
//         - **Purpose:** Presents the user with contextually relevant, clickable options for selecting one or more choices based on the conversation context.  
//         - **When to Use:** DO NOT USE as the first turn in the conversation. Only use if suggested in the current objective.
//         - **Context Parameter:** Use the optional context parameter to provide additional information that will help generate more relevant and tailored options.
//           `,
//           parameters: z.object({
//             text: z.string().describe("The question or statement for which to generate selectable options"),
//             context: z.string().optional().describe("Additional context to help generate more relevant options")
//           }),
//           execute: async ({ text, context }: { 
//             text: string; 
//             context?: string 
//           }) => {
//             try {
//               logger.debug('Executing displayOptionsMultipleChoice tool', { 
//                 text, 
//                 contextProvided: !!context
//               });
              
//               // Use recent messages from conversation history automatically
//               // This simplifies the API by handling it internally
//               const recentMessages = coreMessages.slice(-5).map(m => ({
//                 role: m.role,
//                 content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
//               }));
              
//               const result = await generateDisplayOptions({ 
//                 text, 
//                 context,
//                 // Use default system prompt
//                 messagesHistory: recentMessages
//               });
              
//               logger.debug('displayOptionsMultipleChoice result:', { 
//                 options: result.options,
//                 optionsCount: result.options.length
//               });
              
//               return {
//                 type: "options",
//                 options: result.options
//               };
//             } catch (error) {
//               logger.error('Error in displayOptionsMultipleChoice tool:', error);
//               // Return a safe fallback
//               return {
//                 type: "options",
//                 options: ["Continue the conversation", "Ask a different question"]
//               };
//             }
//           },
//         },
  

//         thinkingHelp: {
//           description: `The ThinkPad tool allows Franko to pause and reflect internally when faced with a complex or ambiguous situation in a customer research interview. 
//           It analyzes the current challenge based on the user's last response and the full conversation history, considers multiple conversational moves, and selects the best approach for the next turn. 
//           The output is for Franko's internal use only and is not shared with the user; the main agent handles crafting the actual response. 
//           **When to use:** Franko should use the ThinkPad tool at his discretion in these specific situations:

//         - **Vague or unclear user responses:** When the user's answer lacks detail or clarity (e.g., "It's fine," "Maybe," or "I'm not sure").
//         - **Complex user questions:** When the user asks a question with multiple possible interpretations or layers (e.g., "How should I improve my entire workflow?").
//         - **Multiple conversational paths: When the conversation could reasonably go in several directions, and Franko needs to choose the most effective one (e.g., deepening the current topic, shifting focus, or clarifying).
//         - **Critical decision points:** When the next move could significantly impact the conversation's direction or the quality of insights gathered (e.g., transitioning to a new objective or addressing a sensitive topic).
//         - **Uncertainty about the next step:** When Franko feels unsure about the best way to proceed or needs to weigh the pros and cons of different approaches.

//         **Usage Notes**
//         - Discretionary Use: Use the ThinkPad sparingly, only when the conversation's complexity or ambiguity warrants deeper reflection.
//         - Internal Only: The analysis is hidden from the user and used within a multi-step turn to inform Franko's decision-making.
//         - Supports Main Agent: The Chosen Path guides the main agent in constructing the final response, leveraging its training in response style.`,
//           parameters: z.object({
//             _dummy: z.string().optional().describe("Placeholder parameter - not used")
//           }),
//           execute: async () => {
//             try {
//               logger.debug('Executing thinking help tool');
              
//               const result = await thinkingHelp({ 
//                 messages: coreMessages,
//                 userId: userId || 'external' // Use 'external' as fallback for public chats
//               });
              
//               logger.api('Thinking help tool result:', {
//                 resultLength: result.length,
//                 result: result.substring(0, 100) + (result.length > 100 ? '...' : '') // Log first 100 chars
//               });
              
//               // Ensure we return a properly serializable object
//               return {
//                 type: 'internal-guidance',
//                 text: result,
//                 experimental_providerMetadata: {
//                   metadata: {
//                     type: 'internal-guidance',
//                     isVisible: false
//                   }
//                 }
//               };
//             } catch (error) {
//               logger.error('Error in thinkingHelp tool:', error);
//               // Return a safe fallback
//               return {
//                 type: 'internal-guidance',
//                 text: "I should respond to the user's message directly and clearly.",
//                 experimental_providerMetadata: {
//                   metadata: {
//                     type: 'internal-guidance',
//                     isVisible: false
//                   }
//                 }
//               };
//             }
//           },
//         },
//       };
  
//       /**
//        * onFinish Callback
//        * 
//        * Purpose: Safe implementation that catches errors during message processing
//        */
//       const safeOnFinish = async ({ responseMessages }: { responseMessages: any[] }) => {
//         try {
//           // Process new messages
//           const newProcessedMessages = responseMessages.map(m => {
//             let content = m.content;
            
//             // If it's a string, it might be wrapped in markdown and JSON
//             if (typeof content === 'string') {
//               // First remove markdown wrapping if present
//               if (content.startsWith('```json\n') && content.endsWith('\n```')) {
//                 content = content.slice(8, -4); // Remove ```json\n and \n```
//               }
              
//               try {
//                 // Then parse the JSON content
//                 const parsed = JSON.parse(content);
//                 // Use the parsed content directly - this is the actual message
//                 return { ...m, content: parsed.content };
//               } catch (e) {
//                 // If JSON parsing fail, use content as is
//                 logger.debug('Failed to parse message content as JSON:', e);
//                 return { ...m, content };
//               }
//             }
            
//             // If it's not a string (e.g., already an array), use as is
//             return { ...m, content };
//           }).filter(m => {
//             // Filter out objective updates from UI display
//             const metadata = m.experimental_providerMetadata?.metadata;
//             return !(metadata && metadata.type === 'objective-update' && metadata.isVisible === false);
//           });
  
//           // Determine if we're saving to a chat instance or chat response
//           if (chatInstanceId) {
//             // This is a public chat response - save to chat response
//             try {
//               // Get existing chat response
//               const existingChatResponse = await getChatResponseById(id);
//               const existingMessages = existingChatResponse?.messagesJson ? JSON.parse(existingChatResponse.messagesJson) : [];
              
//               // Find the latest user message from coreMessages
//               const latestUserMessage = [...coreMessages]
//                 .filter(m => m.role === 'user')
//                 .pop();
              
//               // Check if this user message is already saved
//               const userMessageExists = existingMessages.some((m: { role: string; content: string }) => 
//                 m.role === 'user' && 
//                 m.content === latestUserMessage?.content
//               );
              
//               // Create the updated message array
//               const allMessages = [...existingMessages];
              
//               // Add the user message if it's not already saved
//               if (latestUserMessage && !userMessageExists) {
//                 allMessages.push({
//                   id: generateUUID(),
//                   role: latestUserMessage.role,
//                   content: latestUserMessage.content
//                 });
//               }
              
//               // Add the AI response messages
//               allMessages.push(...newProcessedMessages);
  
//               // Immediately update chat response with current messages
//               await updateChatResponseMessages(id, JSON.stringify(allMessages));
  
//               logger.info('Chat response updated successfully:', { id });
//             } catch (error) {
//               logger.error('Error updating chat response:', error);
//             }
//           } else if (userId) {
//             // This is a regular authenticated chat - save to chat instance
//             try {
//               // Get existing chat instance
//               const existingChat = await getChatInstanceById(id);
//               const existingMessages = existingChat ? JSON.parse(existingChat.messages || '[]') : [];
              
//               // Find the latest user message from coreMessages
//               const latestUserMessage = [...coreMessages]
//                 .filter(m => m.role === 'user')
//                 .pop();
              
//               // Check if this user message is already saved
//               const userMessageExists = existingMessages.some((m: { role: string; content: string }) => 
//                 m.role === 'user' && 
//                 m.content === latestUserMessage?.content
//               );
              
//               // Create the updated message array
//               const allMessages = [...existingMessages];
              
//               // Add the user message if it's not already saved
//               if (latestUserMessage && !userMessageExists) {
//                 allMessages.push({
//                   id: generateUUID(),
//                   role: latestUserMessage.role,
//                   content: latestUserMessage.content
//                 });
//               }
              
//               // Add the AI response messages
//               allMessages.push(...newProcessedMessages);
  
//               // Immediately update chat with current messages
//               await updateChatInstance(id, {
//                 messages: JSON.stringify(allMessages),
//               });
  
//               // Non-blocking objective update
//               Promise.resolve().then(async () => {
//                 try {
//                   logger.debug('Starting objective update process');
                  
//                   const objectiveResult = await objectiveUpdate({
//                     messages: coreMessages,
//                     userId,
//                     chatId: id
//                   });
  
//                   logger.api('Objective update result in route handler:', {
//                     resultLength: objectiveResult.length,
//                     result: objectiveResult
//                   });
  
//                   // Create objective update message
//                   const objectiveMessage = {
//                     role: 'tool' as const,
//                     content: objectiveResult,
//                     experimental_providerMetadata: {
//                       metadata: {
//                         type: 'objective-update',
//                         isVisible: false
//                       }
//                     }
//                   };
  
//                   // Add objective update to all messages
//                   allMessages.push(objectiveMessage);
  
//                   // Update chat instance with all messages including objective update
//                   await updateChatInstance(id, {
//                     messages: JSON.stringify(allMessages),
//                   });
  
//                   logger.debug('Objective update message added to chat history');
  
//                   // After objective update is complete, update progress bar (non-blocking)
//                   Promise.resolve().then(async () => {
//                     try {
//                       // Only call progressBarUpdate for authenticated users (not for external/public chats)
//                       if (userId) {
//                         // Pass all messages including the new objective update
//                         await progressBarUpdate({
//                           messages: [...coreMessages, objectiveMessage as unknown as CoreMessage],
//                           chatId: id
//                         });
//                       } else {
//                         logger.debug('Skipping progress bar update for external user');
//                       }
//                     } catch (error) {
//                       logger.error('Failed to update progress bar:', error);
//                     }
//                   });
//                 } catch (error) {
//                   logger.error('Failed to process objective update:', error);
//                 }
//               });
  
//               logger.info('Chat updated successfully:', { id });
//             } catch (error) {
//               logger.error('Error updating chat instance:', error);
//             }
//           }
//         } catch (error) {
//           logger.error('Error in onFinish callback:', error);
//         }
//       };
  
//       /**
//        * AI Model Configuration
//        * 
//        * Sets up the AI model with:
//        * - System prompt with tool usage instructions
//        * - Core messages from the conversation
//        * - Available tools and their configurations
//        * - Maximum steps for multi-turn interactions
//        */
//       const result = await streamText({
//         model: geminiFlashModel,
//         system: systemPrompt,
//         messages: coreMessages,
//         tools: safeTools,
//         onFinish: safeOnFinish,
//         experimental_telemetry: {
//           isEnabled: true,
//           functionId: "stream-text",
//           onTelemetry: (telemetryData: any) => {
//             try {
//               logger.ai('AI Telemetry:', telemetryData);
//             } catch (error) {
//               logger.error('Error logging telemetry:', error);
//             }
//           }
//         } as any,
//       });
  
//       logger.debug('Raw model response:', {
//         result: result.response,
//       });
  
//       // Add performance logging at the end
//       const endTime = performance.now();
//       logger.info('Request completed', {
//         id,
//         duration: `${(endTime - startTime).toFixed(2)}ms`
//       });
  
//       // Return streaming response
//       return result.toDataStreamResponse({
//         headers: {
//           'Content-Type': 'text/event-stream',
//           'Cache-Control': 'no-cache, no-transform',
//           'Connection': 'keep-alive',
//         }
//       });
//     } catch (error) {
//       logger.error('Error processing chat request:', error);
//       // Return a structured error response instead of throwing
//       return new Response(
//         JSON.stringify({ error: 'An error occurred processing your request' }),
//         { 
//           status: 500,
//           headers: {
//             'Content-Type': 'application/json',
//             'Cache-Control': 'no-cache'
//           }
//         }
//       );
//     }
//   }
  
//   /**
//    * DELETE Request Handler
//    * 
//    * Removes chat histories with security checks:
//    * 1. Validates chat ID exists
//    * 2. Verifies user is authenticated
//    * 3. Confirms user owns the chat
//    * 4. Performs deletion
//    */
  
//   export async function DELETE(request: Request) {
//     logger.debug('Incoming delete request');
  
//     try {
//       const { searchParams } = new URL(request.url);
//       const id = searchParams.get("id");
  
//       if (!id) {
//         return new Response("Not Found", { status: 404 });
//       }
  
//       const { userId } = await auth();
//       if (!userId) {
//         return new Response("Unauthorized", { status: 401 });
//       }
  
//       try {
//         const chat = await getChatInstanceById(id);
        
//         // Return 404 if chat doesn't exist
//         if (!chat) {
//           return new Response("Chat not found", { status: 404 });
//         }
  
//         logger.info('Found chat to delete:', { id, userId: chat.userId });
        
//         if (chat.userId !== userId) {
//           logger.error('Unauthorized delete attempt:', { 
//             chatUserId: chat.userId, 
//             requestUserId: userId 
//           });
//           return new Response("Unauthorized", { status: 401 });
//         }
  
//         await deleteChatInstance(id);
//         logger.info('Chat deleted successfully:', { id });
        
//         return new Response("Chat deleted", { status: 200 });
//       } catch (error) {
//         return new Response("An error occurred while processing your request", {
//           status: 500,
//         });
//       }
//     } catch (error) {
//       logger.error('Error deleting chat:', error);
//       return new Response("An error occurred while processing your request", {
//         status: 500,
//       });
//     }
//   }
  
//   /**
//    * Key Integration Points:
//    * 
//    * 1. AI Model (ai/index.ts):
//    *    - Gemini Pro configuration
//    *    - Response generation
//    * 
//    * 2. Tools (ai/actions.ts):
//    *    - Tool implementations
//    *    - Data generation
//    * 
//    * 3. Database (db/queries.ts):
//    *    - Chat storage
//    *    - History retrieval
//    * 
//    * 4. Authentication (auth.ts):
//    *    - Session management
//    *    - User verification
//    * 
//    * 5. Logging (lib/logger.ts):
//    *    - Error tracking
//    *    - Performance monitoring
//    */
  
//   /**
//    * Message Format Handling Guide
//    * 
//    * Current Message Types:
//    * 1. Simple Messages (most common)
//    * {
//    *   role: 'user' | 'assistant',
//    *   content: string
//    * }
//    * 
//    * 2. Tool Calls (when AI uses a tool)
//    * {
//    *   role: 'assistant',
//    *   content: [{
//    *     type: 'tool-call',
//    *     toolName: string,
//    *     args: object
//    *   }]
//    * }
//    * 
//    * 3. Tool Results (after tool execution)
//    * {
//    *   role: 'tool',
//    *   content: [{
//    *     type: 'tool-result',
//    *     toolName: string,
//    *     result: object
//    *   }]
//    * }
//    * 
//    * Guidelines for New Tools:
//    * 1. Always include 'type' field in tool content
//    * 2. Keep tool results JSON-serializable
//    * 3. Include a 'text' field for human-readable output
//    * 4. Follow existing patterns for special tools:
//    *    - displayOptions: { text: string, display: string[] }
//    *    - searchResults: { query: string, results: array }
//    * 
//    * Example of Well-Structured Tool:
//    * {
//    *   description: "Tool description for AI",
//    *   parameters: z.object({
//    *     // Zod schema defines expected inputs
//    *     param1: z.string().describe("Description"),
//    *   }),
//    *   execute: async (args) => {
//    *     // Return standardized format
//    *     return {
//    *       text: "Human readable result",
//    *       data: { ... }, // Tool-specific data
//    *     };
//    *   }
//    * }
//    */

