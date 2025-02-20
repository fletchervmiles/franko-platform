/*
 * Overview:
 * This is a client-side React component that renders chat messages in a UI.
 * It handles different message types (user/assistant), attachments, and various tool invocations.
 * The component uses Framer Motion for animations and supports markdown content.
 */

"use client"; // Marks this as a client-side component

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { ConversationPlan } from "./conversation-plan";
import { OptionButtons } from "./OptionButtons";

/*
 * Message Component:
 * Renders a single message in the chat interface with support for:
 * - Different roles (user/assistant)
 * - Text content with markdown
 * - Tool invocation results
 * - File attachments
 */
export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
}) => {
  // Skip rendering if:
  // 1. Empty assistant message with no tool results
  // 2. Assistant message with only web search tool
  // 3. Message with only whitespace or newline characters
  if (role === "assistant" && 
      ((!content || content === "" || (typeof content === "string" && content.trim() === "")) && 
       (!toolInvocations?.length || 
        toolInvocations.every(t => t.toolName === "searchWeb")))
  ) {
    return null;
  }

  /*
   * Extracts response content from JSON-formatted messages
   * Used when content is wrapped in JSON with ```json code blocks
   */
  const getDisplayContent = (content: string) => {
    try {
      // Content is already processed in route.ts, just return it
      return content;
    } catch (error) {
      console.error('Error processing content:', error);
      return content;
    }
  };

  return (
    // Main message container with animation
    // Uses Framer Motion for smooth entry animation
    // Styling: flex layout, responsive width, padding and spacing
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}  // Start slightly below and invisible
      animate={{ y: 0, opacity: 1 }}  // Animate to final position and fade in
    >
      {/* Avatar container for user/assistant icon
          Fixed size square with centered content */}
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      {/* Main content container with dark mode support */}
      <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 w-full">
        {/* Render markdown content if it exists and is a string */}
        {content && typeof content === "string" && (
          <Markdown>{getDisplayContent(content)}</Markdown>
        )}

        {/* Tool Invocations Section:
            Maps through each tool invocation and renders appropriate component based on tool type */}
        {toolInvocations && (
        toolInvocations.map((toolInvocation) => {
            const { toolName, toolCallId, state } = toolInvocation;

            if (state === "result") {
            const { result } = toolInvocation;

            if (toolName === "searchWeb") return null;

            return (
                <div key={toolCallId}>
                {toolName === "displayOptions" && result?.type === "options" ? (
                    <OptionButtons 
                    options={result.display} 
                    chatId={chatId}
                    text={result.text}
                    />
                ) : toolName === "generateConversationPlan" ? (
                    <ConversationPlan 
                    plan={result} 
                    />
                ) : (
                    <div>{JSON.stringify(result, null, 2)}</div>
                )}
                </div>
            );
            } else {
            return (
                <div key={toolCallId} className="skeleton">
                {toolName === "displayOptions" ? (
                    <OptionButtons options={[]} chatId={chatId} />
                ) : toolName === "generateConversationPlan" ? (
                    <ConversationPlan />
                ) : null}
                </div>
            );
            }
        })
        )}
                {/* Attachments Section:
                    Renders file attachments in a horizontal layout */}
                {attachments && (
                <div className="flex flex-row gap-2">
                    {attachments.map((attachment) => (
                    <PreviewAttachment key={attachment.url} attachment={attachment} />
                    ))}
                </div>
                )}
            </div>
            </motion.div>
        );
        };

/*
 * Integration Notes:
 * 1. This component expects to be used within a chat interface
 * 2. Requires the AI SDK to be properly configured for tool invocations
 * 3. Depends on various custom components for specific tool results
 * 4. Uses Tailwind CSS for styling
 * 5. Requires Framer Motion for animations
 * 
 * AI SDK Documentation References:
 * - Attachment type: Used for file attachments in messages
 * - ToolInvocation type: Represents tool calls and their results
 * - Tool state handling: Supports 'running' and 'result' states
 */

/*
 * Key File Interactions:
 * 
 * 1. API Route Handler
 * Path: app/(chat)/api/chat/route.ts
 * - Processes chat messages and tool invocations
 * - Handles conversation history saving
 * - Manages tool execution and response streaming
 * 
 * 2. AI Actions Generator
 * Path: ai/actions.ts
 * - Contains all tool implementation functions
 * - Generates sample data for flight tools
 * - Defines data schemas for tool responses
 * 
 * 3. Tool-Specific Components:
 * - Flight Status: components/flights/flight-status.tsx
 *   Displays flight details with loading states
 * - Weather: components/custom/weather.tsx
 *   Shows weather information for locations
 * - Option Buttons: components/custom/OptionButtons.tsx
 *   Renders interactive choice buttons
 * - Boarding Pass: components/flights/boarding-pass.tsx
 *   Shows flight boarding information
 * - Reservation: components/flights/create-reservation.tsx
 *   Displays booking confirmation details
 * 
 * 4. Database Queries
 * Path: db/queries.ts
 * - Handles saving and retrieving chat history
 * - Manages reservation data storage
 * 
 * 5. Authentication
 * Path: app/(auth)/auth.ts
 * - Verifies user sessions
 * - Required for saving chat history
 * 
 * 6. Layout Components
 * Path: components/custom/markdown.tsx
 * - Renders formatted message content
 * Path: components/custom/icons.tsx
 * - Provides UI icons for messages
 */

