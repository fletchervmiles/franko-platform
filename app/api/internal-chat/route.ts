/**
 * Internal Chat API Route Handler
 * 
 * This file manages the internal chat API endpoint:
 * - POST: Process new messages for internal analysis
 * 
 * This route is adapted from the external chat route but modified for internal use.
 */

// Import necessary dependencies
import { 
  convertToCoreMessages,
  Message,
  streamText,
  CoreMessage
} from "ai";
import { z } from "zod";
import * as console from 'console';
import { LRUCache } from 'lru-cache';

// Import custom modules and functions
import { geminiFlashModel } from "@/ai_folder";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { getChatResponseById } from "@/db/queries/chat-responses-queries";
import { 
  getInternalChatSessionById, 
  updateInternalChatSession 
} from "@/db/queries/internal-chat-sessions-queries";
import { updateProfile, getProfile } from "@/db/queries/profiles-queries";
import { generateUUID } from "@/lib/utils";
import { logger } from '@/lib/logger';
import { auth } from "@clerk/nextjs/server";

// Message Role type
type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

/**
 * GET handler for testing endpoint accessibility
 */
export async function GET() {
  console.log('📢 INTERNAL CHAT GET ENDPOINT ACCESSED 📢');
  return new Response(JSON.stringify({ status: "ok", message: "Internal chat API is accessible" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * POST Request Handler
 */
export async function POST(request: Request) {
  const startTime = performance.now();
  logger.debug('Incoming internal chat request');
  console.log('📢 INTERNAL CHAT API ROUTE CALLED 📢');

  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Extract request data
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
    
    // Extract key values from request
    const { 
      messages, 
      id = generateUUID(), 
      internalChatSessionId
    } = requestData;
    
    // Verify the internal chat session exists
    if (!internalChatSessionId) {
      logger.error('Missing internalChatSessionId in request');
      return new Response("Missing internalChatSessionId parameter", { status: 400 });
    }

    const internalChatSession = await getInternalChatSessionById(internalChatSessionId);
    if (!internalChatSession) {
      logger.error('Internal chat session not found', { internalChatSessionId });
      return new Response("Internal chat session not found", { status: 404 });
    }
    
    // Verify that the user owns this session
    if (internalChatSession.userId !== userId) {
      logger.error('User does not own this internal chat session', { userId, sessionUserId: internalChatSession.userId });
      return new Response("Unauthorized to access this chat session", { status: 403 });
    }
    
    // Update the user's internal chat usage count
    try {
      const profile = await getProfile(userId);
      if (profile) {
        const currentCount = profile.totalInternalChatQueriesUsed || 0;
        await updateProfile(userId, {
          totalInternalChatQueriesUsed: currentCount + 1
        });
      }
    } catch (error) {
      // Don't fail the request if we can't update the count
      logger.error('Failed to update internal chat usage count', { error, userId });
    }
    
    // Get the context data from the session
    let systemPrompt = "";
    
    if (!internalChatSession.contextData) {
      logger.error('No context data found in session', { internalChatSessionId });
      return new Response(JSON.stringify({ error: "Session has no context data. Please process context first." }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // Use the cached context data from the session
      systemPrompt = internalChatSession.contextData as string;
      logger.info('Using context data from session', { 
        contextLength: systemPrompt.length 
      });
    }
    
    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages).filter(
      (message) => message.content.length > 0,
    );
    
    logger.api('Processed messages:', {
      messageCount: coreMessages.length,
      messages: coreMessages.map(m => ({
        role: m.role,
        contentLength: typeof m.content === 'string' ? m.content.length : "0",
        content: typeof m.content === 'string' ? m.content : ''
      }))
    });
    
    // Stream response from AI
    const result = await streamText({
      model: geminiFlashModel,
      system: systemPrompt,
      messages: coreMessages,
      
      // Empty tools array to satisfy typings
      tools: [] as any,
      
      // Save chat history
      onFinish: async ({ responseMessages }) => {
        try {
          // Process response messages
          const newProcessedMessages = responseMessages.map(m => {
            return { ...m, content: m.content };
          });
          
          // Get existing chat
          const existingSession = await getInternalChatSessionById(internalChatSessionId);
          if (!existingSession) {
            logger.error('Internal chat session not found for updating messages', { internalChatSessionId });
            return;
          }
          
          // Parse existing messages
          const existingMessages = existingSession.messagesJson ? 
            JSON.parse(existingSession.messagesJson as string) : 
            [];
            
          // Find the latest user message
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
          
          // Update the session with new messages
          await updateInternalChatSession(internalChatSessionId, {
            messagesJson: JSON.stringify(allMessages),
          });
          
          logger.info('Internal chat session updated successfully:', { internalChatSessionId });
        } catch (error) {
          logger.error('Failed to update internal chat session:', { error, internalChatSessionId });
        }
      },
    });
    
    // Log performance
    const endTime = performance.now();
    logger.info('Internal chat request completed', {
      id,
      internalChatSessionId,
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
    // Error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Error processing internal chat request: ${errorMessage}`);
    
    if (errorStack) {
      logger.debug(`Error stack: ${errorStack}`);
    }
    
    // Return error response
    return new Response(JSON.stringify({
      error: "Failed to process internal chat request",
      message: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}