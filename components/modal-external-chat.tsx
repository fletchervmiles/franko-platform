"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Message } from "ai"
import { Loader2 } from "lucide-react"
import { isDarkColor } from "@/lib/color-utils"

// Import existing components we'll reuse
import { Message as ChatMessage } from "@/components/message"
import { ChatInput } from "@/components/input"
import { LazyDirectProgressBar } from "@/components/lazy-components"
import { useChatResponseUser } from "@/lib/hooks/use-chat-response-user"
import { WelcomeBanner } from "@/components/welcome-banner"
import { useExternalChat } from "@/lib/hooks/use-external-chat"
import { FinishConversationButton } from "@/components/finish-conversation-button"
import { hasEndingPhrases } from "@/lib/utils/conversation-helper"
import { extractResponseFromAIOutput } from '@/lib/utils/json-parser'

interface ExtendedMessage extends Message {
  objectives?: Record<string, { status: string; count?: number; target?: number; guidance?: string; }> | null;
}

interface ModalExternalChatProps {
  chatInstanceId: string;
  chatResponseId: string;
  initialMessages: ExtendedMessage[];
  welcomeDescription?: string;
  onConversationComplete?: () => void;
  disableProgressBar?: boolean;
  bodyBackground?: string;
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

export function ModalExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
  welcomeDescription,
  onConversationComplete,
  disableProgressBar = false,
  bodyBackground,
}: ModalExternalChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [visible, setVisible] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [isReadyToFinish, setIsReadyToFinish] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [areAllObjectivesDone, setAreAllObjectivesDone] = useState(false);
  const [hasEndingMessage, setHasEndingMessage] = useState(false);
  const initialGreetingSentRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use optimized hook for fetching user data
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
      // NO URL HISTORY CHANGES IN MODAL MODE
      console.log('Message finished in modal mode');
    }
  });
  
  // Track user messages for progress bar with memoization
  const userMessageCount = useMemo(() => {
    return messages.filter(m => m.role === 'user').length;
  }, [messages]);
  
  // Function to handle when all objectives are done
  const handleAllObjectivesDone = useCallback((allDone: boolean) => {
    if (allDone) {
      console.log('All objectives are done - MODAL MODE');
      setAreAllObjectivesDone(true);
      setIsReadyToFinish(true);
    }
  }, []);
  
  // Memoize the actual messages to avoid re-renders when only loading state changes
  const isDarkMode = useMemo(() => {
    return bodyBackground ? isDarkColor(bodyBackground) : false;
  }, [bodyBackground]);

  const assistantTextColor = isDarkMode ? "#ffffff" : undefined;

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
        textColor={assistantTextColor}
      />
    ));
  }, [messages, chatResponseId, assistantTextColor]);

  // Memoize the loading indicator
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
        textColor={assistantTextColor}
      />
    );
  }, [isLoading, messages, chatResponseId, assistantTextColor]);

  // Memoize the progress bar to prevent unnecessary re-renders
  const progressBarElement = useMemo(() => {
    if (disableProgressBar || !showProgressBar) return null;
    return (
      <LazyDirectProgressBar 
        messages={messages} 
        onAllObjectivesDone={handleAllObjectivesDone}
      />
    );
  }, [disableProgressBar, showProgressBar, messages, handleAllObjectivesDone]);

  // Detect mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Add effect for fade-in animation when initialization completes
  useEffect(() => {
    if (!isInitializing) {
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isInitializing]);
  
  // Simple auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);
  
  // Only update UI when user message count changes (unless disabled)
  useEffect(() => {
    if (disableProgressBar) return;
    if (userMessageCount >= 2 && !showProgressBar) {
      setShowProgressBar(true);
    }
  }, [disableProgressBar, userMessageCount, showProgressBar]);
  
  // Function to check for end conditions
  const checkEndConditions = useCallback(() => {
    if (isFinished || isLoading) return;
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const content = typeof lastMessage.content === 'string' 
          ? extractResponseFromAIOutput(lastMessage.content)
          : '';
        
        if (hasEndingPhrases(content)) {
          console.log('Ending phrases detected in last message - MODAL MODE');
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

  // MODAL-SPECIFIC: Auto-complete when both conditions are met (NO REDIRECT)
  useEffect(() => {
    if (areAllObjectivesDone && hasEndingMessage && !isFinished) {
      console.log('Auto-complete conditions met in MODAL MODE - calling completion handler');
      
      const completeTimeout = setTimeout(async () => {
        setIsFinished(true);
        
        // Call the modal completion handler instead of redirecting
        if (onConversationComplete) {
          onConversationComplete();
        }

        // Still finalize in background for data consistency
        try {
          const finalizeUrl = `/api/external-chat/finalize?chatResponseId=${encodeURIComponent(chatResponseId)}`;
          await fetch(finalizeUrl, { method: 'POST' });
        } catch (error) {
          console.error('Background finalization error:', error);
        }
      }, 1500); // 1.5 seconds delay
      
      return () => clearTimeout(completeTimeout);
    }
  }, [areAllObjectivesDone, hasEndingMessage, isFinished, chatResponseId, onConversationComplete]);

  // Send auto greeting once at initialization
  useEffect(() => {
    if (isInitializing && chatResponseId && !initialGreetingSentRef.current) {
      console.log("Starting auto-greeting process - MODAL MODE");
      
      initialGreetingSentRef.current = true;
      
      const sendGreeting = async () => {
        try {
          const greeting = "Hi, I'm ready!";
          
          const mockEvent = { 
            preventDefault: () => {},
            isAutoGreeting: true 
          } as React.FormEvent<HTMLFormElement> & { isAutoGreeting: boolean };
          
          try {
            await handleSubmit(mockEvent, greeting);
            console.log("Initial greeting sent successfully - MODAL MODE");
          } catch (err) {
            console.error("Failed to submit greeting:", err);
          } finally {
            setIsInitializing(false);
          }
        } catch (error) {
          console.error("Auto greeting failed:", error);
          setIsInitializing(false);
        }
      };
      
      sendGreeting();
    }
  }, [chatResponseId, isInitializing, handleSubmit]);

  // Use the custom hook to prevent zooming
  usePreventZoom();

  // Loading screen during initialization
  if (isInitializing) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: bodyBackground || (isDarkMode ? "#000" : "#fff"), color: isDarkMode ? "#ffffff" : "#000000" }}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: "#E4F222" }} />
          <p className="mt-2 text-sm">
            Initializing conversation...
          </p>
        </div>
      </div>
    );
  }

  // Create fade-in effect CSS style
  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out'
  };

  return (
    <div 
      className="flex h-full w-full flex-col overflow-hidden" 
      style={{ 
        touchAction: "manipulation",
        overscrollBehavior: 'none',
        ...fadeStyle
      }}
    >
      {/* Display the welcome banner if a description exists */}
      <WelcomeBanner welcomeDescription={welcomeDescription} />
      
      <div 
        ref={messagesContainerRef}
        data-message-container="true"
        className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14 pb-4"
        style={{ 
          WebkitOverflowScrolling: "touch",
          position: "relative",
          WebkitTouchCallout: "none",
          overscrollBehavior: "none",
          touchAction: "pan-y",
          backgroundColor: bodyBackground || undefined,
        }}
      >
        <div className="mx-auto max-w-4xl w-full py-4 md:py-8 space-y-8">
          {messageElements}
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

      <div className="border-t" style={{ backgroundColor: bodyBackground || undefined }}>
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading || isFinished}
          showProgressBar={showProgressBar}
          progressBar={progressBarElement}
          stop={stop}
          messageContainerRef={messagesContainerRef}
          wrapperBackground={bodyBackground}
          containerBackground={bodyBackground}
        />
      </div>
    </div>
  );
} 