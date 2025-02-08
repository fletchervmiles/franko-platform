/**
 * Chat Component Overview
 * 
 * This is the main chat interface component that orchestrates the entire chat experience.
 * It serves as the central hub for managing the client-side chat state and UI.
 * 
 * Data Flow Between Components:
 * 
 * 1. Client-Side (this component + useChat hook):
 *    - Manages UI state and WebSocket connection
 *    - Handles real-time updates and streaming
 *    - Makes HTTP POST requests to server
 *    - Updates UI based on responses
 * 
 * 2. Server-Side (route.ts):
 *    - Receives requests from useChat
 *    - Processes messages with AI model
 *    - Executes tools (weather, flights, etc.)
 *    - Saves chat history
 *    - Streams responses back
 * 
 * Complete Flow:
 * User Input → useChat → POST to route.ts → AI Processing → 
 * Stream Response → useChat → Update UI
 * 
 * Key Interactions:
 * - MultimodalInput: Captures user input
 * - PreviewMessage: Displays messages and tool results
 * - route.ts: Handles server-side processing
 * - Database: Stores chat history
 */

"use client"; // Marks this as a client-side component

// Import required dependencies from AI SDK and React
import { Attachment, Message } from "ai";  // Types for attachments and messages from AI SDK
import { useChat } from "ai/react";        // Main chat hook from AI SDK for managing chat state
import { useState } from "react";          // React state management
import { useRouter } from 'next/navigation';  // Add this import at the top

// Import custom components
import { Message as PreviewMessage } from "@/components/custom/message";  // Custom message display component
import { useScrollToBottom } from "./use-scroll-to-bottom";  // Custom hook for scroll behavior
import { MultimodalInput } from "./multimodal-input";    // Custom input component
import { Overview } from "./overview";      // Welcome screen component

/**
 * Chat Component
 * @param {string} id - Unique identifier for the chat session
 * @param {Array<Message>} initialMessages - Pre-existing messages to load
 * 
 * useChat Integration:
 * - Manages client-side state and WebSocket connection
 * - Handles form submissions and message streaming
 * - Makes POST requests to /api/chat/route.ts
 * - Updates UI based on streamed responses
 * 
 * Route.ts Integration:
 * - Receives requests from useChat
 * - Processes with AI and executes tools
 * - Streams responses back to useChat
 * - Saves chat history to database
 */
export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const router = useRouter();  // Add this near other hooks
  
  // Initialize chat with AI SDK's useChat hook
  // This creates the bridge between client UI and server processing
  const { 
    messages,      // Current messages (updated in real-time)
    handleSubmit,  // Handles form submission to route.ts
    input,         // Current input value
    setInput,      // Input setter
    append,        // Add new messages locally
    isLoading,     // Loading state during processing
    stop          // Stop message generation
  } = useChat({
    id,                // Chat session identifier
    body: { id },      // Additional data sent to route.ts
    initialMessages,   // Pre-existing messages
    maxSteps: 10,      // Conversation turn limit
    onFinish: (message) => {  // Callback when message stream completes
      window.history.replaceState({}, "", `/chat/${id}`);
      
      // Check for COMPLETED end conversation calls
      const completedCalls = message.toolInvocations?.filter((call) => 
        'result' in call && 
        call.toolName === 'endConversation'
      );

      if (completedCalls?.length) {
        const endCall = completedCalls[0];
        if ('result' in endCall) {
          const { redirectUrl, delayMs } = endCall.result as { redirectUrl: string; delayMs: number };
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, delayMs);
        }
      }
    },
    experimental_onToolCall: async (tools: any[]) => {
      // Handle any specific tool call side effects if needed
      const displayOptionsTool = tools.find(tool => tool.toolName === 'displayOptions');
      if (displayOptionsTool) {
        // You could add any special handling here
        return;
      }
    }
  });

  // Custom hook for scrolling chat to bottom on new messages
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // State for managing file attachments
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    // Main chat container with responsive layout
    <div className="flex flex-row justify-center pb-4 md:pb-8 h-dvh bg-background">
      <div className="flex flex-col justify-between items-center gap-4">
        {/* Messages container with scroll */}
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-dvw items-center overflow-y-scroll"
        >
          {/* Show welcome screen if no messages */}
          {messages.length === 0 && <Overview />}

          {/* Map through and display each message */}
          {messages.map((message) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              role={message.role}
              content={message.content}
              attachments={message.experimental_attachments}
              toolInvocations={message.toolInvocations}
            />
          ))}

          {/* Invisible div for scroll anchoring */}
          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        {/* Input form with multimodal capabilities */}
        <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[500px] max-w-[calc(100dvw-32px) px-4 md:px-0">
          <MultimodalInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
          />
        </form>
      </div>
    </div>
  );
}
