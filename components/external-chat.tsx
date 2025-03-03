/**
 * External Chat Component
 * 
 * This client component handles the main chat interface for external users:
 * 1. Manages chat state using the AI SDK's useChat hook
 * 2. Renders messages and handles user input
 * 3. Processes AI responses and tool invocations
 * 4. Handles navigation to completion page when chat ends
 * 5. Shows progress indicators and loading states
 * 
 * This is the core UI component that external users interact with when
 * participating in a conversation. It handles all real-time chat functionality
 * and communicates with the backend API.
 */

"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { Message } from "ai"
import { useChat } from "ai/react"
import { Message as ChatMessage } from "@/components/message"
import { ChatInput } from "@/components/input"
import { ExternalChatProgress } from "@/components/external-chat-progress"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface ExternalChatProps {
  chatInstanceId: string       // ID of the chat instance
  chatResponseId: string       // ID of the chat response record
  initialMessages: Message[]   // Initial messages to display
}

export function ExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
}: ExternalChatProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [autoMessageSent, setAutoMessageSent] = useState(false)
  const [userMessageCount, setUserMessageCount] = useState(0)

  // Use the AI SDK's useChat hook to manage the chat state
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setInput,
    stop
  } = useChat({
    api: "/api/external-chat",
    id: chatResponseId,
    body: {
      chatInstanceId,
      chatResponseId
    },
    initialMessages
  })

  // Auto-submit "Hi" message to trigger the agent's first response
  useEffect(() => {
    if (messages.length === 0 && !isLoading && !autoMessageSent) {
      setInput("Hi");
      setTimeout(() => {
        try {
          handleSubmit(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>);
          setInput(""); // Clear input after submission
          setAutoMessageSent(true); // Prevent duplicate submissions
          setUserMessageCount(1); // Count the initial "Hi" as the first user message
        } catch (error) {
          console.error("Error auto-submitting initial message:", error);
          // Continue without blocking the UI experience
        }
      }, 300);
    }
  }, [messages.length, isLoading, autoMessageSent, setInput, handleSubmit]);

  // Filter out the initial "Hi" message for display
  const displayMessages = messages.filter(
    (message, index) => !(index === 0 && message.role === "user" && message.content === "Hi")
  );

  // Scroll to the bottom when new messages come in
  useEffect(() => {
    if (autoScrollEnabled) {
      scrollToBottom()
    }
  }, [messages, autoScrollEnabled])

  // Handle beforeunload event to warn user if they try to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault()
        e.returnValue = "You have an ongoing chat. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isLoading])

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }
  
  // Track user messages and update showProgressBar logic
  useEffect(() => {
    // Check if a new user message was added
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.role === "user" && latestMessage.content !== "Hi") {
      setUserMessageCount(prevCount => prevCount + 1);
    }
  }, [messages]);

  // Update progress bar visibility based on user message count
  useEffect(() => {
    if (userMessageCount >= 2) {
      setShowProgressBar(true);
    }
  }, [userMessageCount]);

  // Render the chat interface
  return (
    <div className="flex h-full flex-col">
      {/* Main chat area with messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12"
        onScroll={(e) => {
          const target = e.currentTarget
          const isAtBottom =
            target.scrollHeight - target.scrollTop <= target.clientHeight + 100
          setAutoScrollEnabled(isAtBottom)
        }}
      >
        <div className="mx-auto max-w-3xl space-y-6 py-8">
          {/* Show loading indicator when only the filtered "Hi" message exists */}
          {displayMessages.length === 0 && isLoading && (
            <ChatMessage
              content=""
              isUser={false}
              chatId={chatResponseId}
              isLoading={true}
              messageIndex={-1}
              allMessages={[]}
              isFirstInTurn={true}
            />
          )}

          {displayMessages.map((message, index) => {
            // Determine if this message is the first in a turn
            const isFirstInTurn = index === 0 || 
              // If previous message was from a different role, this is first in turn
              displayMessages[index - 1]?.role !== message.role;
              
            return (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.role === "user"}
                toolInvocations={message.toolInvocations}
                chatId={chatResponseId}
                isLoading={isLoading && index === displayMessages.length - 1 && message.role !== "user"}
                messageIndex={index}
                allMessages={displayMessages}
                isFirstInTurn={isFirstInTurn}
              />
            );
          })}

          {isLoading && displayMessages[displayMessages.length - 1]?.role === "user" && (
            <ChatMessage
              content=""
              isUser={false}
              chatId={chatResponseId}
              isLoading={true}
              messageIndex={-1}
              allMessages={[]}
              isFirstInTurn={true}
            />
          )}

          {/* Error message display */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              <p className="font-medium">Error</p>
              <p>{error.message}</p>
            </div>
          )}

          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input form for sending messages */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-2 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isLoading}
            showProgressBar={showProgressBar}
            progressBar={showProgressBar ? 
              <ExternalChatProgress 
                chatResponseId={chatResponseId} 
                messageCount={messages.length} 
              /> : undefined
            }
            stop={stop}
          />
        </div>
      </div>
    </div>
  )
} 