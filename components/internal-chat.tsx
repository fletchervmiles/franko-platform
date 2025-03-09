"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat, Message } from "ai/react";
import { Loader2 } from "lucide-react";

import { Message as ChatMessage } from "@/components/message";
import { ChatInput } from "@/components/input";

interface InternalChatProps {
  internalChatSessionId: string;
  initialMessages: Message[];
}

export function InternalChat({
  internalChatSessionId,
  initialMessages = [],
}: InternalChatProps) {
  console.log("InternalChat component mounting with session ID:", internalChatSessionId);
  console.log("Initial messages:", initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  console.log("Setting up useChat with API path: /api/internal-chat");
  
  // Get window origin safely
  const [apiUrl, setApiUrl] = useState("/api/internal-chat");
  
  useEffect(() => {
    // Update API URL with origin in client
    setApiUrl(window.location.origin + "/api/internal-chat");
  }, []);

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
    api: apiUrl,
    id: internalChatSessionId,
    body: { internalChatSessionId },
    initialMessages,
    onError: (err) => {
      console.error("useChat hook error:", err);
    },
    onResponse: (response) => {
      console.log("useChat response status:", response.status);
    },
  });
  
  // Check for and send initial message from sessionStorage
  useEffect(() => {
    // Only run once when the component mounts
    const initialMessageKey = `initial-message-${internalChatSessionId}`;
    const initialMessage = sessionStorage.getItem(initialMessageKey);
    
    if (initialMessage) {
      console.log("📤 Found initial message in sessionStorage:", initialMessage);
      
      // Remove it to prevent sending it again on refresh
      sessionStorage.removeItem(initialMessageKey);
      console.log("🗑️ Removed initial message from sessionStorage");
      
      // Give a moment for the chat to initialize
      setTimeout(() => {
        try {
          // Create a mock event object with preventDefault
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          
          console.log("📤 Sending initial message from sessionStorage");
          handleSubmit(mockEvent, { data: { message: initialMessage } });
          console.log("✅ Initial message submitted");
        } catch (error) {
          console.error("❌ Error sending initial message:", error);
        }
      }, 500);
    } else {
      console.log("No initial message found in sessionStorage");
    }
  }, [internalChatSessionId, handleSubmit]);
  
  // Memoize the message elements to avoid re-renders
  const messageElements = useMemo(() => {
    return messages.map((message, index) => (
      <ChatMessage
        key={message.id}
        content={message.content}
        isUser={message.role === "user"}
        chatId={internalChatSessionId}
        isLoading={false}
        toolInvocations={message.toolInvocations}
        messageIndex={index}
        allMessages={messages}
        isFirstInTurn={
          index === 0 || messages[index - 1]?.role !== message.role
        }
      />
    ));
  }, [messages, internalChatSessionId]);

  // Memoize the loading indicator
  const loadingIndicator = useMemo(() => {
    if (!isLoading || messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return null;
    }
    
    return (
      <ChatMessage
        content=""
        isUser={false}
        chatId={internalChatSessionId}
        isLoading={true}
        messageIndex={-1}
        allMessages={[]}
        isFirstInTurn={true}
      />
    );
  }, [isLoading, messages, internalChatSessionId]);

  // Auto-scroll effect
  useEffect(() => {
    if (!messagesEndRef.current) return;
    
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    // Only scroll if we're at or near the bottom already
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
  }, [messages.length]);

  // Show error state if present
  if (error) {
    console.error("Chat error detected:", error);
  }

  // Always log current message state
  console.log("Current messages state:", messages);

  // Add welcome message if no messages (this is a critical test)
  useEffect(() => {
    if (messages.length === 0) {
      console.log("No messages - would expect initial welcome message to be added");
      
      // Test if we can access the API endpoint directly
      fetch(apiUrl)
        .then(res => {
          console.log("Direct API fetch response:", res.status);
          return res.json();
        })
        .then(data => {
          console.log("Direct API fetch data:", data);
        })
        .catch(err => {
          console.error("Direct API fetch error:", err);
        });
    }
  }, [messages, apiUrl]);

  // Only show loading state if explicitly loading a response
  if (isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Analyzing your responses... 
            {error && <span className="text-red-500 block mt-2">{error.message}</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
        <div className="mx-auto max-w-4xl space-y-8 py-8">
          {/* Welcome message when no messages exist yet */}
          {messages.length === 0 && (
            <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">Ready to analyze your responses</h3>
              <p className="text-muted-foreground mb-4">
                Ask questions about patterns, themes, or specific details from the collected responses.
              </p>
              <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded">
                <p className="font-medium mb-1">Example questions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>What are the common themes across all responses?</li>
                  <li>Summarize the key points mentioned by respondents</li>
                  <li>What did people say about [specific topic]?</li>
                </ul>
              </div>
            </div>
          )}

          {/* Show all messages */}
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
            stop={stop}
            showProgressBar={false}
          />
        </div>
      </div>
    </div>
  );
}