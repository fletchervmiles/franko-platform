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

import { useState, useEffect, useRef } from "react";
import { useChat, Message } from "ai/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Message as ChatMessage } from "@/components/message";
import { ChatInput } from "@/components/input";
import { ExternalChatProgress } from "@/components/external-chat-progress";

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
  const [userMessageCount, setUserMessageCount] = useState(0);

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

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Track user messages for progress bar
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    setUserMessageCount(userMessages.length);
    
    if (userMessages.length >= 2) {
      setShowProgressBar(true);
    }
  }, [messages]);

  // Send auto greeting once at initialization
  useEffect(() => {
    const sendGreeting = async () => {
      try {
        // Default greeting message
        let greeting = "Hi, I'm ready!";

        // Try to get user's name if available
        try {
          const res = await fetch(`/api/chat-responses/${chatResponseId}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.intervieweeFirstName) {
              greeting = `Hi, I'm ${data.intervieweeFirstName} and I'm ready!`;
            }
          }
        } catch (nameError) {
          console.error("Failed to get user name, using default greeting", nameError);
        }

        console.log(`Sending initial greeting: "${greeting}"`);
        
        // Set the input value first
        setInput(greeting);
        
        // Use setTimeout to ensure state updates before submitting
        setTimeout(async () => {
          try {
            // Create a mock form event
            const mockEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
            
            // Submit the form with the greeting message
            await handleSubmit(mockEvent);
            
            // Clear the input after sending
            setInput("");
            
            console.log("Initial greeting sent successfully");
          } catch (submitError) {
            console.error("Failed to submit initial greeting:", submitError);
          } finally {
            // End initialization regardless of success/failure
            setIsInitializing(false);
          }
        }, 100);
      } catch (error) {
        console.error("Auto greeting process failed:", error);
        setIsInitializing(false);
      }
    };

    // Only send greeting on initial render if we're still initializing
    if (isInitializing && chatResponseId) {
      console.log("Starting auto-greeting process");
      sendGreeting();
    }
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
        <div className="mx-auto max-w-4xl space-y-8 py-8">
          {/* Show all messages including the auto-greeting */}
          {messages.map((message, index) => (
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
          ))}

          {/* Show typing animation when waiting for AI response */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
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
            progressBar={
              showProgressBar && (
                <ExternalChatProgress
                  chatResponseId={chatResponseId}
                  messageCount={messages.length}
                />
              )
            }
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}