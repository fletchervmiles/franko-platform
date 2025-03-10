/**
 * Utility Functions Module
 * 
 * Purpose:
 * - Provides common utility functions used throughout the application
 * - Handles type conversions and data transformations
 * - Manages local storage operations
 * - Processes chat messages and tool interactions
 * 
 * Technical Features:
 * - Type-safe utility functions
 * - Error handling for API requests
 * - Local storage management
 * - UUID generation
 */

import {
  CoreMessage,
  CoreToolMessage,
  generateId,
  Message,
  ToolInvocation,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type SelectChatInstance } from "@/db/schema/chat-instances-schema";

// Environment detection utility
export const getEnvironment = () => {
  // Simple environment variable switch
  return process.env.NEXT_PUBLIC_USE_PRODUCTION === 'true' ? 'production' : 'staging';
};

// Utility function to merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type definition for application-specific errors
interface ApplicationError extends Error {
  info: string;
  status: number;
}

// Generic fetch utility with error handling
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    // Create and configure custom error object
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

// Utility to safely access localStorage with fallback
export function getLocalStorage(key: string) {
  // Check if window exists (client-side only)
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

// Generate a UUID (Universally Unique Identifier)
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper function to add tool message results to chat messages
function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          // Find matching tool result for the invocation
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: "result",
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

// Convert core messages to UI-friendly format
export function convertToUIMessages(
  messages: Array<CoreMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    // Handle tool messages
    if (message.role === "tool") {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = "";
    let toolInvocations: Array<ToolInvocation> = [];

    // Process different types of message content
    if (typeof message.content === "string") {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === "text") {
          textContent += content.text;
        } else if (content.type === "tool-call") {
          toolInvocations.push({
            state: "call",
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        }
      }
    }

    // Add processed message to chat messages array
    chatMessages.push({
      id: generateId(),
      role: message.role,
      content: textContent,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

// Extract title from chat messages
export function getTitleFromChat(chat: SelectChatInstance) {
  const messages = chat.messages ? convertToUIMessages(JSON.parse(chat.messages)) : [];
  const firstMessage = messages[0];

  if (!firstMessage) {
    return "Untitled";
  }

  return firstMessage.content;
}
