// /**
//  * External Chat Component
//  * 
//  * This client component handles the main chat interface for external users:
//  * 1. Manages chat state using the AI SDK's useChat hook
//  * 2. Renders messages and handles user input
//  * 3. Processes AI responses and tool invocations
//  * 4. Handles navigation to completion page when chat ends
//  * 5. Shows progress indicators and loading states
//  * 
//  * This is the core UI component that external users interact with when
//  * participating in a conversation. It handles all real-time chat functionality
//  * and communicates with the backend API.
//  */

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat, Message } from "ai/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Message as ChatMessage } from "@/components/message";
import { ChatInput } from "@/components/input";
import { ExternalChatProgress } from "@/components/external-chat-progress";
import { useChatResponseUser } from "@/lib/hooks/use-chat-response-user";

interface ExternalChatProps {
  chatInstanceId: string;
  chatResponseId: string;
  initialMessages: Message[];
}

export function ExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
}: ExternalChatProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Use optimized hook for fetching user data
  // IMPORTANT: All hooks must be called in the same order on every render
  const { data: userData, isLoading: isLoadingUserData } = useChatResponseUser(chatResponseId);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    error,
    stop,
  } = useChat({
    api: "/api/external-chat",
    id: chatResponseId,
    body: { chatInstanceId, chatResponseId },
    initialMessages,
    onFinish: (message) => {
      window.history.replaceState({}, "", `/chat/external/${chatInstanceId}/active?responseId=${chatResponseId}`);
      
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
    }
  });
  
  // All memoized values should be defined here in a consistent order
  // 1. Track user messages for progress bar with memoization
  const userMessageCount = useMemo(() => {
    return messages.filter(m => m.role === 'user').length;
  }, [messages]);
  
  // 2. Memoize the actual messages to avoid re-renders when only loading state changes
  const messageElements = useMemo(() => {
    return messages.map((message, index) => (
      <ChatMessage
        key={message.id}
        content={message.content}
        isUser={message.role === "user"}
        chatId={chatResponseId}
        isLoading={false}
        toolInvocations={message.toolInvocations}
        messageIndex={index}
        allMessages={messages}
        isFirstInTurn={
          index === 0 || messages[index - 1]?.role !== message.role
        }
      />
    ));
  }, [messages, chatResponseId]);

  // 3. Memoize the loading indicator
  const loadingIndicator = useMemo(() => {
    if (!isLoading || messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return null;
    }
    
    return (
      <ChatMessage
        content=""
        isUser={false}
        chatId={chatResponseId}
        isLoading={true}
        messageIndex={-1}
        allMessages={[]}
        isFirstInTurn={true}
      />
    );
  }, [isLoading, messages, chatResponseId]);

  // 4. Memoize the progress bar to prevent unnecessary re-renders
  const progressBarElement = useMemo(() => {
    if (!showProgressBar) return null;
    
    return (
      <ExternalChatProgress
        chatResponseId={chatResponseId}
        messageCount={messages.length}
      />
    );
  }, [showProgressBar, chatResponseId, messages.length]);

  // Optimized auto-scroll effect with debounce
  useEffect(() => {
    // Only scroll when messages change and we have a reference
    if (!messagesEndRef.current) return;
    
    // Use requestAnimationFrame to schedule the scroll for the next frame
    // This is more efficient than doing it on every render
    let scrollTimeoutId: number;
    
    const scrollToBottom = () => {
      scrollTimeoutId = requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    };
    
    // Only scroll if we're at or near the bottom already
    // This prevents interrupting the user if they're scrolling up to read
    const shouldScroll = () => {
      const container = messagesEndRef.current?.parentElement;
      if (!container) return true;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If we're within 100px of the bottom, auto-scroll
      return scrollHeight - scrollTop - clientHeight < 100;
    };
    
    if (shouldScroll()) {
      scrollToBottom();
    }
    
    // Cleanup
    return () => {
      if (scrollTimeoutId) {
        cancelAnimationFrame(scrollTimeoutId);
      }
    };
  }, [messages.length]);
  
  // Only update UI when user message count changes
  useEffect(() => {
    if (userMessageCount >= 2 && !showProgressBar) {
      setShowProgressBar(true);
    }
  }, [userMessageCount, showProgressBar]);
  
  // Send auto greeting once at initialization
  useEffect(() => {
    // Only execute this effect once when the component mounts
    // Make sure we have a chat response ID and we're in initializing state
    if (isInitializing && chatResponseId) {
      console.log("Starting auto-greeting process");
      
      // Use a simpler approach that's more reliable
      const sendGreeting = async () => {
        try {
          // Default greeting that doesn't depend on user data
          const greeting = "Hi, I'm ready!";
          
          console.log(`Sending greeting: "${greeting}"`);
          
          // Set the input value
          setInput(greeting);
          
          // Small delay to ensure state is updated
          setTimeout(() => {
            try {
              // Create a mock form event
              const mockEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
              
              // Submit the form with the greeting message
              handleSubmit(mockEvent)
                .then(() => {
                  console.log("Initial greeting sent successfully");
                  // Clear the input after sending
                  setInput("");
                })
                .catch(err => {
                  console.error("Failed to submit greeting:", err);
                })
                .finally(() => {
                  // End initialization regardless of success/failure
                  setIsInitializing(false);
                });
            } catch (submitError) {
              console.error("Auto greeting submit error:", submitError);
              setIsInitializing(false);
            }
          }, 300); // Use a slightly longer delay to ensure all state is properly updated
        } catch (error) {
          console.error("Auto greeting failed:", error);
          setIsInitializing(false);
        }
      };
      
      // Wait a moment for everything to be ready
      setTimeout(sendGreeting, 500);
    }
    // Only run once on mount but include required dependencies to satisfy React
  }, [chatResponseId, isInitializing, handleSubmit, setInput]);

  // Loading screen during initialization
  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Initializing conversation...
          </p>
        </div>
      </div>
    );
  }

  // All useMemo hooks have been moved to the top of the component

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
        <div className="mx-auto max-w-4xl space-y-8 py-8">
          {/* Show all messages including the auto-greeting */}
          {messageElements}

          {/* Show typing animation when waiting for AI response */}
          {loadingIndicator}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              <p className="font-medium">Error</p>
              <p>{error.message}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t px-4 py-2 md:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isLoading}
            showProgressBar={showProgressBar}
            progressBar={progressBarElement}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}