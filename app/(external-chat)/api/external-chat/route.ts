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
  generateText,  
  
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
    
    // Force a cache miss to ensure we're using the updated prompt file
    // Comment this out after testing to use the cache again
    _invalidatePromptCache(organizationName || 'default');
    
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
    // First, process the messages to use fullResponse when available for assistant messages
    const processedMessages = messages.map((message: any) => {
      // If this is an assistant message with a fullResponse, use that instead of content
      if (message.role === 'assistant' && message.fullResponse) {
        console.log('Using fullResponse for message:', message.id);
        // Create a new message using the fullResponse as the content
        return {
          ...message,
          content: message.fullResponse
        };
      }
      return message;
    });
    
    // Then convert to core messages
    const coreMessages = convertToCoreMessages(processedMessages).filter(
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
     * AI Response Configuration
     * 
     * Sets up the AI model with:
     * - System prompt loaded from file
     * - Message history (coreMessages)
     * - Response generation settings
     */

    // Log the complete request configuration
    console.log("\n=== FULL REQUEST DETAILS BEGIN ===");
    console.log("System Prompt:", systemPrompt);
    console.log("\nMessage History:", JSON.stringify(coreMessages, null, 2));
    console.log("\nRequest Configuration:", JSON.stringify({
      model: geminiFlashModel,
      maxTokens: 5000,
      temperature: 1,
    }, null, 2));
    console.log("=== FULL REQUEST DETAILS END ===\n");

    const result = await generateText({
      model: geminiFlashModel,
      system: systemPrompt,
      messages: coreMessages,
      maxTokens: 5000,  // Appropriate limit for responses
      temperature: 1, // Balanced creativity
    });

    // Log the complete, untruncated response
    console.log("\n=== FULL AI RESPONSE BEGIN ===");
    console.log(result.text);
    console.log("=== FULL AI RESPONSE END ===\n");

    // Extract the relevant part of the response
    let parsedContent;
    let displayText;

    try {
      // The result.text might be wrapped in ```json ``` or be plain JSON
      const jsonText = result.text.includes('```json')
        ? result.text.split('```json\n')[1].split('\n```')[0]
        : result.text;
        
      parsedContent = JSON.parse(jsonText);
      
      // Extract just the "response" field for display
      displayText = parsedContent.response || result.text;
      
      logger.debug('Successfully parsed JSON response', { 
        responseLength: displayText.length,
        contentSnippet: displayText.substring(0, 100) + (displayText.length > 100 ? '...' : '')
      });
    } catch (error) {
      logger.error('Failed to parse JSON response:', error);
      // Fallback to using the raw text if parsing fails
      parsedContent = { response: result.text };
      displayText = result.text;
    }

    // Create a complete message for database storage
    const completeResponseMessage = {
      id: generateUUID(),
      role: 'assistant',
      content: result.text, // Store the full JSON response
      createdAt: new Date()
    };

    // Create a simulated streaming response with just the user-facing content
    const simulatedResponseMessage = {
      id: completeResponseMessage.id, // Use the same ID for consistency
      role: 'assistant',
      content: displayText, // Just the extracted "response" field
      createdAt: new Date()
    };

    logger.debug('AI response generated and parsed:', {
      fullResponseLength: result.text.length,
      displayTextLength: displayText.length,
      displayTextSnippet: displayText.substring(0, 100) + (displayText.length > 100 ? '...' : '')
    });

    // Save the message to the database (non-blocking)
    Promise.resolve().then(async () => {
      try {
        // Process new messages - use result.text instead of result.messages
        // Using the text as the content for a single message
        const processedMessage = {
          id: completeResponseMessage.id,
          role: 'assistant' as const,
          content: displayText
        };

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
        
        // Add the AI response message with the full JSON
        allMessages.push(completeResponseMessage);

        // Immediately update chat with current messages
        await updateChatResponse(chatResponseId, {
          messagesJson: JSON.stringify(allMessages),
        });

        // NOTE: Progress bar and objective updates are now removed since we're
        // parsing objectives directly from the response in the client

        logger.info('Chat updated successfully:', { chatResponseId });
      } catch (error) {
        logger.error('Failed to update chat:', { error, chatResponseId });
      }
    });

    // Add performance logging at the end
    const endTime = performance.now();
    logger.info('Request completed', {
      id,
      chatResponseId,
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });

    // Function to chunk the text for simulated streaming
    function chunkText(text: string, size = 4) {
      const chunks = [];
      let position = 0;
      
      while (position < text.length) {
        // Calculate the next chunk size (variable for natural feel)
        const variableSize = size + Math.floor(Math.random() * 3);
        const chunk = text.slice(position, position + variableSize);
        position += variableSize;
        chunks.push(chunk);
      }
      
      return chunks;
    }

    // Return a complete response instead of streaming
    // This simplifies the implementation and avoids SSE parsing issues
    return new Response(
      JSON.stringify({
        id: simulatedResponseMessage.id,
        role: 'assistant',
        content: displayText,
        // Include the objectives data explicitly for the progress bar
        objectives: parsedContent.currentObjectives || null,
        // Include the full raw response for preservation in message history
        fullResponse: result.text,
        createdAt: simulatedResponseMessage.createdAt
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
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

