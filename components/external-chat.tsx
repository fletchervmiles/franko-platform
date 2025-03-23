"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Message } from "ai";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Head from "next/head";

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

// Custom hook to prevent zooming on mobile
const usePreventZoom = () => {
  useEffect(() => {
    // Create a meta tag to prevent zooming
    const metaTag = document.createElement('meta');
    metaTag.name = 'viewport';
    metaTag.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    
    // Find any existing viewport meta tags
    const existingMetaTag = document.querySelector('meta[name="viewport"]');
    
    if (existingMetaTag) {
      // Update existing meta tag
      existingMetaTag.setAttribute('content', metaTag.content);
    } else {
      // Add new meta tag
      document.head.appendChild(metaTag);
    }
    
    // Cleanup - restore original meta tag on unmount
    return () => {
      if (existingMetaTag) {
        existingMetaTag.setAttribute('content', 'width=device-width, initial-scale=1');
      } else if (document.head.contains(metaTag)) {
        document.head.removeChild(metaTag);
      }
    };
  }, []);
};

export function ExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
  welcomeDescription,
}: ExternalChatProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  // Detect Safari browser
  const [isSafari, setIsSafari] = useState(false);

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

  // Detect mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Enhanced scroll behavior for immediate scrolling on user message submission
  useEffect(() => {
    // This effect specifically handles auto-scrolling when isLoading changes
    // (which happens right after user submits a message)
    if (isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user') {
      // Immediate scroll to show loading indicator
      if (messagesContainerRef.current) {
        if (isMobile) {
          // On mobile, scroll to top with slight delay to ensure rendering
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = 0;
            }
          }, 50);
        } else {
          // On desktop, scroll to bottom
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }
    }
  }, [isLoading, messages, isMobile]);
  
  // Original auto-scroll effect using IntersectionObserver (keep this too)
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    
    // Create an observer for the end marker
    const options = {
      root: messagesContainerRef.current,
      threshold: 0.1
    };
    
    let shouldAutoScroll = true;
    
    const observer = new IntersectionObserver((entries) => {
      // If end marker is visible (intersecting), we're at the end
      shouldAutoScroll = entries[0].isIntersecting;
    }, options);
    
    // Observe the end marker
    observer.observe(messagesEndRef.current);
    
    // Scroll function based on mobile vs desktop
    const scrollToLatestMessage = () => {
      if (!messagesContainerRef.current) return;
      
      if (isMobile) {
        // On mobile, scroll to top (which shows bottom messages in reversed layout)
        messagesContainerRef.current.scrollTop = 0;
      } else {
        // On desktop, scroll to bottom
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };
    
    // If we should auto-scroll and have messages, do it
    if (shouldAutoScroll && messages.length > 0) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(scrollToLatestMessage);
    }
    
    // Cleanup
    return () => {
      if (messagesEndRef.current) {
        observer.unobserve(messagesEndRef.current);
      }
      observer.disconnect();
    };
  }, [messages.length, isMobile]);
  
  // Prevent zoom using touch events on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    // Add touch event listeners
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    
    // Safari-specific gesture event
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    
    // @ts-ignore - TypeScript doesn't recognize gesturestart
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      // @ts-ignore
      document.removeEventListener('gesturestart', preventGesture);
    };
  }, [isMobile]);
  
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
      
      // Create a flag to track if greeting has been sent
      let greetingProcessed = false;
      
      const sendGreeting = async () => {
        try {
          // Default greeting that doesn't depend on user data
          const greeting = "Hi, I'm ready!";
          
          console.log(`Preparing to send greeting: "${greeting}"`);
          
          // Create a mock form event with auto-greeting flag
          const mockEvent = { 
            preventDefault: () => {},
            isAutoGreeting: true 
          } as React.FormEvent<HTMLFormElement> & { isAutoGreeting: boolean };
          
          try {
            // Submit the form with the greeting message directly
            console.log('Calling handleSubmit with greeting');
            const submitted = await handleSubmit(mockEvent, greeting);
            greetingProcessed = true;
            
            // Log appropriate message based on whether it was sent or skipped
            if (submitted === true) {
              console.log("Initial greeting sent successfully");
            } else {
              console.log("Initial greeting skipped (already sent previously)");
            }
          } catch (err) {
            console.error("Failed to submit greeting:", err);
            greetingProcessed = true;
          } finally {
            // Only end initialization if we've actually processed the greeting
            if (greetingProcessed) {
              console.log('Setting isInitializing to false');
              setIsInitializing(false);
            } else {
              console.warn('Greeting was not processed properly');
              // Force it to finish anyway after a timeout to prevent UI lockup
              setTimeout(() => {
                console.log('Forcing initialization to complete after timeout');
                setIsInitializing(false);
              }, 2000);
            }
          }
        } catch (error) {
          console.error("Auto greeting failed:", error);
          setIsInitializing(false);
        }
      };
      
      // Execute the greeting function immediately without delay
      sendGreeting().catch(err => {
        console.error("Unhandled error in sendGreeting:", err);
        setIsInitializing(false);
      });
    }
  }, [chatResponseId, isInitializing, handleSubmit]);

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

  // Use the custom hook to prevent zooming
  usePreventZoom();

  // Detect Safari browser
  useEffect(() => {
    // Detect Safari
    const ua = navigator.userAgent.toLowerCase();
    setIsSafari(
      /safari/.test(ua) && 
      !/chrome/.test(ua) && 
      !/firefox/.test(ua) &&
      !/edg/.test(ua)
    );
  }, []);

  // More aggressive pull-to-refresh prevention, especially for Safari
  useEffect(() => {
    // Apply these styles immediately to prevent any pull-to-refresh
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overscrollBehavior = 'none';
    
    // Capture all touch moves to prevent Safari overscroll
    const preventOverscroll = (e: TouchEvent) => {
      // If we're at the top of the container and trying to scroll up, prevent it
      if (messagesContainerRef.current) {
        if (messagesContainerRef.current.scrollTop <= 0 && 
            e.touches[0].screenY > e.touches[0].clientY) {
          e.preventDefault();
        }
      }
    };
    
    // Different technique for Safari vs. other browsers
    const preventPullToRefresh = (e: TouchEvent) => {
      if (isSafari) {
        // More aggressive prevention for Safari
        const touchY = e.touches[0].clientY;
        // Prevent all downward pulls from anywhere in the top 150px of the screen
        if (touchY < 150) {
          e.preventDefault();
        }
      } else {
        // Other browsers - only prevent at the very top
        const touchY = e.touches[0].clientY;
        if (touchY < 50 && e.type === 'touchstart') {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventOverscroll, { passive: false });
    
    return () => {
      // Clean up styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overscrollBehavior = '';
      
      // Remove event listeners
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('touchmove', preventOverscroll);
    };
  }, [isSafari]);

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
  
  // Calculate bottom padding to account for input container height
  const bottomPadding = isMobile ? "pb-32" : "pb-40";

  return (
    <div 
      className="flex h-[100dvh] w-full flex-col overflow-hidden" 
      style={{ 
        touchAction: "manipulation",
        position: isSafari ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        overscrollBehavior: 'none'
      }}
    >
      {/* Display the welcome banner if a description exists */}
      <WelcomeBanner welcomeDescription={welcomeDescription} />
      
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto px-4 md:px-8 lg:px-14 ${topMargin} ${bottomPadding}`}
        style={{ 
          WebkitOverflowScrolling: "touch",
          position: "relative",
          WebkitTouchCallout: "none",
          overscrollBehavior: "none",
          ["WebkitOverscrollBehavior" as any]: "none",
          touchAction: "pan-y",
        }}
      >
        <div 
          className={`mx-auto max-w-4xl w-full py-4 md:py-8 ${isMobile ? 'min-h-full flex flex-col justify-end space-y-4' : 'space-y-8'}`}
        >
          {/* Show messages in correct order, but position them at the bottom on mobile */}
          {messageElements}

          {/* Show typing animation when waiting for AI response */}
          {loadingIndicator}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              <p className="font-medium">Error</p>
              <p>{error.message}</p>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#F9F8F6] border-t px-4 py-1 md:py-2 md:px-8 lg:px-12 z-10">
        <div className="mx-auto max-w-4xl">
          {/* Only render the button when all objectives are done */}
          {isReadyToFinish && !isFinished && (
            <div className="flex justify-end mb-1 md:mb-2 pr-8">
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