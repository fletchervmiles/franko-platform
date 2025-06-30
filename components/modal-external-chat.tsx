"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Message } from "ai"
import { Loader2 } from "lucide-react"
import { isDarkColor } from "@/lib/color-utils"
import { generateUUID } from "@/lib/utils"
import { agentsData } from "@/lib/agents-data"

// Import existing components we'll reuse
import { Message as ChatMessage } from "@/components/message"
import { ChatInput } from "@/components/input"
import { LazyDirectProgressBar } from "@/components/lazy-components"
import { useChatResponseUser } from "@/lib/hooks/use-chat-response-user"
import { WelcomeBanner } from "@/components/welcome-banner"
import { FinishConversationButton } from "@/components/finish-conversation-button"
import { hasEndingPhrases } from "@/lib/utils/conversation-helper"
import { extractResponseFromAIOutput } from '@/lib/utils/json-parser'

// Add isTyping to Message type
interface UIMessage extends Message {
  objectives?: Record<string, { status: string; count?: number; target?: number; guidance?: string; }> | null;
  isTyping?: boolean; // Optional typing indicator flag
  fullResponse?: string; // Store full API response for history reconstruction
}

interface ModalExternalChatProps {
  chatInstanceId: string;
  chatResponseId: string;
  agentType?: string; // NEW: Agent type for cached responses
  organizationName?: string; // NEW: Organization name for template replacement
  initialMessages?: UIMessage[];
  welcomeDescription?: string;
  onConversationComplete?: () => void;
  disableProgressBar?: boolean;
  bodyBackground?: string;
  hideProgressBarUI?: boolean; // Add this prop definition
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
  agentType,
  organizationName,
  initialMessages = [],
  welcomeDescription,
  onConversationComplete,
  disableProgressBar = false,
  bodyBackground,
  hideProgressBarUI = false,
}: ModalExternalChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [isReadyToFinish, setIsReadyToFinish] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [areAllObjectivesDone, setAreAllObjectivesDone] = useState(false);
  const [hasEndingMessage, setHasEndingMessage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // NEW: Separate UI from API state
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([]);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [isHiddenMessageSent, setIsHiddenMessageSent] = useState(false); // NEW: Separate flag for hidden message
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // NEW: Refs to track background processing
  const firstApiResponseRef = useRef<any>(null);
  const hiddenMessageCompleteRef = useRef(false);
  const queuedMessageRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false); // NEW: Prevent duplicate initialization
  const mountedRef = useRef(false); // NEW: Track if component is mounted

  // Get agent data
  const agent = useMemo(() => 
    agentsData.find(a => a.id === agentType),
    [agentType]
  );

  // Use optimized hook for fetching user data
  const { data: userData, isLoading: isLoadingUserData } = useChatResponseUser(chatResponseId);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [uiMessages]);

  // Safety fallback: ensure component always initializes within 2 seconds
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (isFirstMessageSent) {
        console.log('ModalExternalChat safety fallback - Force initializing to false after 2 seconds');
        setIsFirstMessageSent(false);
        setVisible(true);
      }
    }, 2000);
    
    return () => clearTimeout(safetyTimer);
  }, [isFirstMessageSent]);

  // NEW: Implement hidden first message
  const sendHiddenFirstMessage = async () => {
    if (isFirstMessageSent) {
      console.log('sendHiddenFirstMessage: Already sent, skipping');
      return;
    }
    
    console.log('sendHiddenFirstMessage: Starting to send hidden message');
    setIsFirstMessageSent(true); // Set this immediately to prevent duplicates
    
    try {
      // This is what the AI SDK needs - a user message
      const response = await fetch('/api/external-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: 'Hi, I\'m ready',
            id: generateUUID()
          }],
          chatInstanceId,
          chatResponseId,
          organizationName,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send first message');
      
      const data = await response.json();
      
      // IMPORTANT: Store the full JSON response for API history
      firstApiResponseRef.current = data;
      
      // Mark hidden message as complete
      hiddenMessageCompleteRef.current = true;
      setIsHiddenMessageSent(true); // Mark the hidden message as sent
      
      // Process any queued message
      if (queuedMessageRef.current) {
        const queued = queuedMessageRef.current;
        queuedMessageRef.current = null;
        console.log('Processing queued message:', queued);
        // Process the queued message
        await sendMessage(queued);
      }
      
      // Log any mismatch for monitoring (but don't show to user)
      if (data.content !== uiMessages[0]?.content) {
        console.log('First response mismatch:', {
          cached: uiMessages[0]?.content,
          actual: data.content
        });
      }
    } catch (error) {
      console.error('Failed to send hidden first message:', error);
      hiddenMessageCompleteRef.current = true; // Allow messages even on error
      setIsHiddenMessageSent(true); // Mark as sent even on error to avoid blocking UI
    }
  };

  // NEW: Show typing indicator then cached response
  useEffect(() => {
    console.log('ModalExternalChat useEffect - Running initialization');
    
    if (!agent) {
      console.log('ModalExternalChat useEffect - No agent found, using fallback initialization');
      setIsFirstMessageSent(false);
      setVisible(true);
      return;
    }
    
    if (initialMessages.length > 0) {
      console.log('ModalExternalChat useEffect - Has initial messages, skipping');
      setIsFirstMessageSent(false);
      setVisible(true);
      return;
    }
    
    console.log('ModalExternalChat useEffect - Starting typing indicator and cached response');
    
    // Step 1: Show typing indicator immediately
    const typingMessage: UIMessage = {
      id: 'typing-indicator',
      role: 'assistant',
      content: '', // Empty content
      isTyping: true, // Special flag for typing state
      createdAt: new Date(),
    };
    
    setUiMessages([typingMessage]);
    console.log('ModalExternalChat - Set typing indicator message');
    
    // Step 2: After 1 second, replace with cached response
    const typingTimer = setTimeout(() => {
      const cachedResponse = agent.cachedFirstResponse
        .replace(/{organisation_name}/g, organizationName || 'our product')
        .replace(/{product}/g, organizationName || 'our product');
      
      const cachedFirstMessage: UIMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: cachedResponse,
        createdAt: new Date(),
        isTyping: false,
      };
      
      console.log('ModalExternalChat - Showing cached response:', cachedResponse);
      setUiMessages([cachedFirstMessage]);
      setIsFirstMessageSent(false);
      setVisible(true);
    }, 1000); // 1 second delay
    
    // Step 3: Send hidden first message in background (starts immediately)
    if (!isFirstMessageSent) {
      sendHiddenFirstMessage();
    }
    
    // Cleanup
    return () => clearTimeout(typingTimer);
  }, [agent, organizationName]); // Only depend on agent and org name

  // NEW: Handle user messages with queueing
  const sendMessage = async (userInput: string) => {
    if (!userInput.trim() || isSending) return;
    
    // If hidden message hasn't completed yet, queue this message
    if (!hiddenMessageCompleteRef.current) {
      console.log('Hidden message still in progress, queueing user message');
      queuedMessageRef.current = userInput;
      // Still show the user message in UI immediately
      const userMessage: UIMessage = {
        id: generateUUID(),
        role: 'user',
        content: userInput,
        createdAt: new Date(),
      };
      setUiMessages(prev => [...prev, userMessage]);
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    // Add user message to UI immediately (if not already added)
    const lastMessage = uiMessages[uiMessages.length - 1];
    if (lastMessage?.content !== userInput || lastMessage?.role !== 'user') {
      const userMessage: UIMessage = {
        id: generateUUID(),
        role: 'user',
        content: userInput,
        createdAt: new Date(),
      };
      setUiMessages(prev => [...prev, userMessage]);
    }
    
    try {
      // Reconstruct full conversation for API
      // IMPORTANT: Use the full JSON response, not just the text shown in UI
      const apiMessages = [
        { role: 'user', content: 'Hi, I\'m ready' }, // Hidden
        { 
          role: 'assistant', 
          // Use the full API response if available, otherwise construct it
          content: firstApiResponseRef.current?.fullResponse || JSON.stringify({
            response: uiMessages[0]?.content || '',
            currentObjectives: {} // Default empty objectives
          })
        },
        ...uiMessages.slice(1).map(msg => ({ // All visible messages except first
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userInput } // Current message
      ];
      
      const response = await fetch('/api/external-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          chatInstanceId,
          chatResponseId,
          organizationName,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add assistant response to UI
      const assistantMessage: UIMessage = {
        id: data.id || generateUUID(),
        role: 'assistant',
        content: data.content,
        objectives: data.objectives || null,
        fullResponse: data.fullResponse,
        createdAt: new Date(),
      };
      
      setUiMessages(prev => [...prev, assistantMessage]);
      
      // Check for conversation completion
      if (data.objectives?.isComplete) {
        onConversationComplete?.();
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error as string);
      // Show error in UI
      setUiMessages(prev => [...prev, {
        id: generateUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  // NEW: Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      await sendMessage(input.trim());
      setInput('');
    }
  }, [input, sendMessage]);

  // NEW: Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);
  
  // Track user messages for progress bar with memoization
  const userMessageCount = useMemo(() => {
    return uiMessages.filter(m => m.role === 'user').length;
  }, [uiMessages]);
  
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
    return uiMessages.map((message, index) => {
      // Handle typing indicator
      if (message.isTyping && !message.content) {
        return (
          <div key={message.id} className="flex items-center h-7 mb-4">
            <div className="flex space-x-2 items-end bg-gray-100 px-4 py-2.5 rounded-xl">
              <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite]"></div>
              <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite_0.2s]"></div>
              <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite_0.4s]"></div>
            </div>
          </div>
        );
      }
      
      // Regular message
      return (
      <ChatMessage
        key={message.id}
        content={message.content}
        isUser={message.role === "user"}
        chatId={chatResponseId}
        isLoading={false}
        toolInvocations={message.toolInvocations}
        messageIndex={index}
          allMessages={uiMessages}
        isFirstInTurn={
            index === 0 || uiMessages[index - 1]?.role !== message.role
        }
        textColor={assistantTextColor}
      />
      );
    });
  }, [uiMessages, chatResponseId, assistantTextColor]);

  // Memoize the loading indicator
  const loadingIndicator = useMemo(() => {
    if (!isSending || uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role !== "user") {
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
  }, [isSending, uiMessages, chatResponseId, assistantTextColor]);

  // Memoize the progress bar to prevent unnecessary re-renders
  const progressBarElement = useMemo(() => {
    if (disableProgressBar || !showProgressBar) return null;
    return (
      <LazyDirectProgressBar 
        messages={uiMessages} 
        onAllObjectivesDone={handleAllObjectivesDone}
        hideUI={true}  // Always hide the UI
      />
    );
  }, [disableProgressBar, showProgressBar, uiMessages, handleAllObjectivesDone]);

  // Detect mobile on mount and on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Simple auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [uiMessages.length]);
  
  // Only update UI when user message count changes (unless disabled)
  useEffect(() => {
    if (disableProgressBar) return;
    if (userMessageCount >= 2 && !showProgressBar) {
      setShowProgressBar(true);
    }
  }, [disableProgressBar, userMessageCount, showProgressBar]);
  
  // Function to check for end conditions
  const checkEndConditions = useCallback(() => {
    if (isFinished || isSending) return;
    
    if (uiMessages.length > 0) {
      const lastMessage = uiMessages[uiMessages.length - 1];
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
  }, [uiMessages, isFinished, isSending]);

  // Effect to check for ending phrases after each message
  useEffect(() => {
    checkEndConditions();
  }, [uiMessages, checkEndConditions]);

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

  // Use the custom hook to prevent zooming
  usePreventZoom();

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
              <p>{error}</p>
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
          disabled={isSending || isFinished}
          showProgressBar={false}  // Always hide the progress bar UI
          progressBar={progressBarElement}
          stop={() => {}}
          messageContainerRef={messagesContainerRef}
          wrapperBackground={bodyBackground}
          containerBackground={bodyBackground}
        />
      </div>
    </div>
  );
} 