"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Message } from "ai";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Define the extended message type here to ensure consistency
interface ExtendedMessage extends Message {
  objectives?: Record<string, { status: string; count?: number; target?: number; guidance?: string; }> | null;
}

import { Message as ChatMessage } from "@/components/message";
import { ChatInput } from "@/components/input";
// Import the lazy version of DirectProgressBar instead of ExternalChatProgress
import { LazyDirectProgressBar } from "@/components/lazy-components";
import { useChatResponseUser } from "@/lib/hooks/use-chat-response-user";
import { WelcomeBanner } from "@/components/welcome-banner";
// Import our custom hook instead of useChat
import { useExternalChat } from "@/lib/hooks/use-external-chat";
import { FinishConversationButton } from "@/components/finish-conversation-button";
import { hasEndingPhrases, extractResponseText } from "@/lib/utils/conversation-helper";

interface ExternalChatProps {
  chatInstanceId: string;
  chatResponseId: string;
  initialMessages: ExtendedMessage[];  // Update to extended message type
  welcomeDescription?: string;
}

export function ExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
  welcomeDescription,
}: ExternalChatProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [isReadyToFinish, setIsReadyToFinish] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAutoFinishing, setIsAutoFinishing] = useState(false);
  const [autoFinishCountdown, setAutoFinishCountdown] = useState(0);
  const lastActivityTimeRef = useRef(Date.now());
  const inactivityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [areAllObjectivesDone, setAreAllObjectivesDone] = useState(false);
  const [hasEndingMessage, setHasEndingMessage] = useState(false);
  // Add ref to track if initial greeting was sent
  const initialGreetingSentRef = useRef(false);

  // Use optimized hook for fetching user data
  // IMPORTANT: All hooks must be called in the same order on every render
  const { data: userData, isLoading: isLoadingUserData } = useChatResponseUser(chatResponseId);

  // Use our custom hook instead of useChat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    error,
    stop,
  } = useExternalChat({
    api: "/api/external-chat",
    id: chatResponseId,
    body: { chatInstanceId, chatResponseId },
    initialMessages,
    onFinish: (message) => {
      // Preserve the welcomeDesc parameter when updating the URL
      const welcomeDescParam = welcomeDescription ? 
        `&welcomeDesc=${encodeURIComponent(welcomeDescription)}` : '';
      window.history.replaceState({}, "", `/chat/external/${chatInstanceId}/active?responseId=${chatResponseId}${welcomeDescParam}`);
      
      // NOTE: The endConversation tool has been removed
      // The redirect functionality would previously happen here
    }
  });
  
  // All memoized values should be defined here in a consistent order
  // 1. Track user messages for progress bar with memoization
  const userMessageCount = useMemo(() => {
    return messages.filter(m => m.role === 'user').length;
  }, [messages]);
  
  // Function to handle when all objectives are done
  const handleAllObjectivesDone = useCallback((allDone: boolean) => {
    if (allDone) {
      console.log('All objectives are done');
      setAreAllObjectivesDone(true);
      setIsReadyToFinish(true);
    }
  }, []);
  
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
      <LazyDirectProgressBar 
        messages={messages} 
        onAllObjectivesDone={handleAllObjectivesDone}
      />
    );
  }, [showProgressBar, messages, handleAllObjectivesDone]);

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
  
  // Function to check for end conditions
  const checkEndConditions = useCallback(() => {
    // If we're already finished or loading, don't check
    if (isFinished || isLoading) return;
    
    // Check the last message for ending phrases
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const content = typeof lastMessage.content === 'string' 
          ? extractResponseText(lastMessage.content) 
          : '';
        
        if (hasEndingPhrases(content)) {
          console.log('Ending phrases detected in last message');
          setHasEndingMessage(true);
          setIsReadyToFinish(true);
        }
      }
    }
  }, [messages, isFinished, isLoading]);

  // Check for ending phrases after each message
  useEffect(() => {
    checkEndConditions();
  }, [messages, checkEndConditions]);

  // Set up inactivity detection
  useEffect(() => {
    // Update last activity time when user sends a message
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      lastActivityTimeRef.current = Date.now();
    }
    
    // Set up interval to check for inactivity
    const INACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
    const INACTIVITY_THRESHOLD = 60 * 60 * 1000; // 1 hour threshold
    
    // Clear any existing interval
    if (inactivityCheckIntervalRef.current) {
      clearInterval(inactivityCheckIntervalRef.current);
    }
    
    // Set up new interval
    inactivityCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTimeRef.current;
      
      // If inactive for threshold, start auto finish countdown
      if (timeSinceLastActivity >= INACTIVITY_THRESHOLD && !isFinished && !isAutoFinishing) {
        console.log('Inactivity threshold reached, starting auto-finish countdown');
        setIsAutoFinishing(true);
        setAutoFinishCountdown(30); // 30 second countdown
      }
    }, INACTIVITY_CHECK_INTERVAL);
    
    // Clean up on unmount
    return () => {
      if (inactivityCheckIntervalRef.current) {
        clearInterval(inactivityCheckIntervalRef.current);
      }
    };
  }, [messages, isFinished, isAutoFinishing]);

  // Handle auto-finish countdown
  useEffect(() => {
    if (isAutoFinishing && autoFinishCountdown > 0) {
      const countdownInterval = setInterval(() => {
        setAutoFinishCountdown((prev) => prev - 1);
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    } else if (isAutoFinishing && autoFinishCountdown === 0) {
      // Time's up, auto-finish the conversation
      setIsFinished(true);
      // This would be where we'd trigger finishing automatically
    }
  }, [isAutoFinishing, autoFinishCountdown]);
  
  // NOTE: Progress bar and objective updates are currently paused in the backend
  // This component will still render the progress bar UI, but it won't update
  // based on conversation progress since those backend functions are disabled

  // Send auto greeting once at initialization
  useEffect(() => {
    // Only execute if not already sent AND we're initializing
    if (isInitializing && chatResponseId && !initialGreetingSentRef.current) {
      console.log("Starting auto-greeting process");
      
      // Mark as sent immediately to prevent race conditions
      initialGreetingSentRef.current = true;
      
      const sendGreeting = async () => {
        try {
          // Default greeting that doesn't depend on user data
          const greeting = "Hi, I'm ready!";
          
          console.log(`Sending greeting: "${greeting}"`);
          
          // Set the input value
          setInput(greeting);
          
          // Use a single timeout with proper error handling
          const timeoutId = setTimeout(() => {
            try {
              // Create a mock form event with auto-greeting flag
              const mockEvent = { 
                preventDefault: () => {},
                isAutoGreeting: true 
              } as React.FormEvent<HTMLFormElement> & { isAutoGreeting: boolean };
              
              // Submit the form with the greeting message
              handleSubmit(mockEvent);
              console.log("Initial greeting sent successfully");
              // Clear the input after sending
              setInput("");
            } catch (err: unknown) {
              console.error("Failed to submit greeting:", err);
            } finally {
              // End initialization regardless of success/failure
              setIsInitializing(false);
            }
          }, 300);
          
          return () => clearTimeout(timeoutId);
        } catch (error) {
          console.error("Auto greeting failed:", error);
          setIsInitializing(false);
        }
      };
      
      // Single timeout with cleanup
      const initialTimeoutId = setTimeout(sendGreeting, 500);
      return () => clearTimeout(initialTimeoutId);
    }
  }, [chatResponseId, isInitializing, handleSubmit, setInput]);

  // Add new effect to auto-redirect when both conditions are met
  useEffect(() => {
    // If both conditions are true, set a timeout for auto-finish
    if (areAllObjectivesDone && hasEndingMessage && !isFinished) {
      console.log('Auto-finish conditions met, starting 5-second countdown');
      
      // Create a 5-second timeout before redirecting
      const redirectTimeout = setTimeout(() => {
        console.log('Auto-finishing conversation after delay');
        
        // FIRST: Immediate redirect with highest priority
        router.push(`/chat/external/${chatInstanceId}/finish`);
        
        // THEN: Defer all other operations to next event cycle
        setTimeout(() => {
          // Update state
          setIsFinished(true);
          
          // Fire and forget - trigger finalization in the background
          fetch('/api/external-chat/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatResponseId })
          }).catch(error => {
            console.error('Background finalization error:', error);
          });
        }, 0);
      }, 5000); // 5 seconds delay
      
      // Clean up timeout if component unmounts
      return () => clearTimeout(redirectTimeout);
    }
  }, [areAllObjectivesDone, hasEndingMessage, isFinished, chatResponseId, chatInstanceId, router]);

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

  // Add top margin if welcome description exists
  const topMargin = welcomeDescription ? "mt-10" : "";

  return (
    <div className="flex h-full flex-col">
      {/* Display the welcome banner if a description exists */}
      <WelcomeBanner welcomeDescription={welcomeDescription} />
      
      <div className={`flex-1 overflow-y-auto px-4 md:px-8 lg:px-14 ${topMargin}`}>
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
          {/* Only render the button when all objectives are done */}
          {isReadyToFinish && !isFinished && (
            <div className="flex justify-end mb-2 pr-8">
              <FinishConversationButton 
                chatResponseId={chatResponseId}
                chatInstanceId={chatInstanceId}
                onFinishStart={() => setIsFinished(true)}
                isAutoFinish={isAutoFinishing}
                countdown={autoFinishCountdown}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-md h-6 text-xs px-2 font-normal border-none"
              />
            </div>
          )}
          
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isLoading || isFinished}
            showProgressBar={showProgressBar}
            progressBar={progressBarElement}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}