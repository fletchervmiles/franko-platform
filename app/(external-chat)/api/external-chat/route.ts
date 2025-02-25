/**
 * External Chat API Route Handler
 * 
 * This file manages all external chat-related API endpoints:
 * - POST: Process new messages and tool executions
 * - GET: Fetch chat progress
 * 
 * Data Flow (POST):
 * 1. Client request → Message content
 * 2. Chat instance context → Conversation plan
 * 3. AI Processing → Gemini Pro model
 * 4. Tool Execution → Various tools
 * 5. Stream Response → Real-time updates
 * 6. Save Chat → Database storage
 */

import { 
  Message,
  convertToCoreMessages,
  streamText,
  CoreMessage,
  CoreToolMessage,
  LanguageModelV1
} from "ai";
import { z } from "zod";
import * as console from 'console';
import fs from 'fs';
import path from 'path';
import { LRUCache } from 'lru-cache';

import { geminiFlashModel } from "@/ai_folder";
import {
  performWebSearch,
  generateDisplayOptions,
  updateChatProgress
} from "@/ai_folder/actions";
import {
  getChatResponseById,
  updateChatResponseMessages,
  updateChatResponseStatus
} from "@/db/queries/chat-responses-queries";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { generateUUID } from "@/lib/utils";
import { logger } from '@/lib/logger';

// Cache for populated prompts
const promptCache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 60,
});

// Add this function to populate the prompt template
async function getPopulatedPrompt(
  organizationName: string,
  organizationContext: string,
  conversationPlan: any
): Promise<string> {
  try {
    const cacheKey = `${organizationName}-${organizationContext}-${JSON.stringify(conversationPlan)}`;
    const cachedPrompt = promptCache.get(cacheKey);
    if (cachedPrompt) {
      logger.debug('Using cached prompt');
      return cachedPrompt;
    }

    logger.debug('Loading prompt template');
    
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'external_chat_prompt.md'),
      'utf-8'
    );

    const populatedPrompt = promptTemplate
      .replace('{organization_name}', organizationName)
      .replace('{organization_context}', organizationContext)
      .replace('{conversation_plan}', JSON.stringify(conversationPlan, null, 2));

    promptCache.set(cacheKey, populatedPrompt);
    
    return populatedPrompt;
  } catch (error) {
    logger.error('Error populating prompt:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  const startTime = performance.now();
  logger.debug('Incoming external chat request');

  try {
    const { messages, chatInstanceId, chatResponseId, organizationName, organizationContext } = await request.json();
    
    logger.ai('Incoming messages:', {
      chatInstanceId,
      chatResponseId,
      messages: messages.map((m: Message) => ({
        role: m.role,
        contentLength: m.content.length,
        content: m.content
      }))
    });

    // Get chat instance for conversation plan
    const chatInstance = await getChatInstanceById(chatInstanceId);
    if (!chatInstance) {
      return new Response("Chat instance not found", { status: 404 });
    }

    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages).filter(
      (message) => message.content.length > 0,
    );

    // Get system prompt with conversation plan context
    const systemPrompt = await getPopulatedPrompt(
      organizationName,
      organizationContext,
      chatInstance.conversationPlan
    );

    const result = await streamText({
      model: geminiFlashModel,
      system: systemPrompt,
      messages: coreMessages,
      tools: {
        endConversation: {
          description: "A tool that ends the conversation and redirects to a completion page.",
          parameters: z.object({
            _dummy: z.string().optional().describe("Placeholder parameter")
          }),
          execute: async () => ({
            message: "Thank you for your time - redirecting you to the completion page...",
            redirectUrl: `/interview-complete/${chatResponseId}`,
            delayMs: 3000
          }),
        },
        
        searchWeb: {
          description: "A tool that performs a web search to gather factual context.",
          parameters: z.object({
            query: z.string().describe("The search query"),
            searchDepth: z
              .enum(["basic", "advanced"])
              .optional()
              .describe("How deep to search"),
            topic: z
              .enum(["general", "news"])
              .optional()
              .describe("Category of search")
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

        displayOptions: {
          description: "Display clickable options for the user to choose from.",
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

        chatProgress: {
          description: "Update and track the progress of the conversation.",
          parameters: z.object({
            _dummy: z.string().optional().describe("Placeholder parameter")
          }),
          execute: async () => {
            const progress = await updateChatProgress({
              messages: coreMessages,
              chatResponseId,
              chatInstanceId,
              organizationName,
              organizationContext
            });
            return {
              type: "progress-update",
              ...progress
            };
          },
        },
      },

      onFinish: async ({ responseMessages }) => {
        try {
          // Process new messages
          const newProcessedMessages = responseMessages.map(m => {
            let content = m.content;
            
            if (typeof content === 'string') {
              if (content.startsWith('```json\n') && content.endsWith('\n```')) {
                content = content.slice(8, -4);
              }
              
              try {
                const parsed = JSON.parse(content);
                return { ...m, content: parsed.content };
              } catch (e) {
                return { ...m, content };
              }
            }
            
            return { ...m, content };
          });

          // Get existing chat response
          const chatResponse = await getChatResponseById(chatResponseId);
          if (!chatResponse) {
            throw new Error('Chat response not found');
          }

          // Combine existing and new messages
          const existingMessages = chatResponse.messagesJson ? JSON.parse(chatResponse.messagesJson) : [];
          const allMessages = [...existingMessages, ...newProcessedMessages];

          // Update chat response with messages
          await updateChatResponseMessages(chatResponseId, JSON.stringify(allMessages));

          // Check for conversation completion
          const isComplete = newProcessedMessages.some(m => {
            const msg = m as Message;
            return msg.toolInvocations?.some((t: { toolName: string }) => 
              t.toolName === 'endConversation' && 'result' in t
            );
          });

          if (isComplete) {
            await updateChatResponseStatus(chatResponseId, "completed", "completed");
          } else {
            // Update progress if not complete
            await updateChatProgress({
              messages: allMessages,
              chatResponseId,
              chatInstanceId,
              organizationName,
              organizationContext
            });
          }

          logger.info('Chat response updated successfully:', { chatResponseId });
        } catch (error) {
          logger.error('Failed to update chat response:', error);
        }
      }
    });

    const endTime = performance.now();
    logger.info('Request completed', {
      chatResponseId,
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });

    return result.toDataStreamResponse({});
  } catch (error) {
    logger.error('Error processing external chat request:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatResponseId = searchParams.get("chatResponseId");

    if (!chatResponseId) {
      return new Response("Chat response ID required", { status: 400 });
    }

    const chatResponse = await getChatResponseById(chatResponseId);
    if (!chatResponse) {
      return new Response("Chat response not found", { status: 404 });
    }

    return new Response(JSON.stringify({
      status: chatResponse.status,
      completionStatus: chatResponse.completionStatus
    }));
  } catch (error) {
    logger.error('Error fetching chat response progress:', error);
    return new Response("Internal server error", { status: 500 });
  }
}
