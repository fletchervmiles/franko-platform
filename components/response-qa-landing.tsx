"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Message, useChat } from "ai/react"
import { ChatInput } from "@/components/response-qa-input"
import { Message as MessageComponent } from "@/components/message-responses"
import { useQuotaAvailability } from "@/hooks/use-quota-availability"
import { AlertTriangle } from "lucide-react"
import { PromptSuggestions } from "@/components/prompt-suggestions"

interface Conversation {
  id: string
  title: string
  responseCount: number
  wordCount: number
}

interface ResponseQALandingProps {
  userId: string
  existingSessionId?: string
  existingConversation?: Conversation | null
}

// Define a type for content items
interface ContentItem {
  type: string;
  text?: string;
}

const promptSuggestionsList = [
  "From all selected interviews, what's the single most important insight, and why does it matter?",
  "Which recurring pain point costs users the most time, money, or frustration?",
  "Which role + company type shows the strongest 'can't-live-without-it' sentiment?",
  "Which requested change would create the biggest lift in satisfaction or retention?"
];

export function ResponseQALanding({ 
  userId, 
  existingSessionId, 
  existingConversation 
}: ResponseQALandingProps) {
  // Add quota checking
  const { hasAvailableQAQuota, isLoading: isQuotaLoading } = useQuotaAvailability();
  
  // State for conversation selection
  const [selectedConversations, setSelectedConversations] = useState<Conversation[]>(
    existingConversation ? [existingConversation] : []
  )
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null)
  const [firstMessageSent, setFirstMessageSent] = useState(!!existingSessionId)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Initialize with existing session if provided
  useEffect(() => {
    if (existingSessionId && !sessionId) {
      setSessionId(existingSessionId);
      setFirstMessageSent(true);
    }
    
    if (existingConversation && selectedConversations.length === 0) {
      setSelectedConversations([existingConversation]);
    }
  }, [existingSessionId, existingConversation, sessionId, selectedConversations.length]);

  // Set up chat functionality using the AI SDK
  const { 
    messages, 
    handleSubmit,
    isLoading: isChatLoading,
    error,
    setMessages,
    setInput,
    input
  } = useChat({
    api: "/api/internal-chat",
    id: sessionId || undefined,
    body: {
      internalChatSessionId: sessionId
    }
  });

  // Memoize the message elements to avoid re-renders
  const messageElements = useMemo(() => {
    return messages.map((message, index) => (
      <MessageComponent
        key={message.id || index}
        content={message.content}
        isUser={message.role === "user"}
        chatId={sessionId || ''}
        isLoading={index === messages.length - 1 && message.role === 'assistant' && isChatLoading}
        messageIndex={index}
        allMessages={messages as any}
        isFirstInTurn={index === 0 || messages[index - 1]?.role !== message.role}
      />
    ));
  }, [messages, sessionId, isChatLoading]);

  // Memoize the loading indicator
  const loadingIndicator = useMemo(() => {
    if (!isChatLoading || messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return null;
    }
    
    return (
      <MessageComponent
        content=""
        isUser={false}
        chatId={sessionId || ''}
        isLoading={true}
        messageIndex={-1}
        allMessages={[]}
        isFirstInTurn={true}
      />
    );
  }, [isChatLoading, messages, sessionId]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleConversationSelect = (conversation: Conversation, existingSessionId?: string) => {
    // Add to selected if not already selected
    if (!selectedConversations.some(c => c.id === conversation.id)) {
      setSelectedConversations(prev => [...prev, conversation])
      
      // If a session ID was provided, set it
      if (existingSessionId) {
        setSessionId(existingSessionId)
        // Don't set firstMessageSent to true here, only when an actual message is sent
      }
    }
  }

  const handleConversationRemove = (conversationId: string) => {
    // Make this a no-op since we no longer want to allow removing selected conversations
    return;
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Handle message submission with the AI SDK
  const handleMessageSubmit = async (message: string) => {
    if (selectedConversations.length === 0) {
      return;
    }

    // If we don't have a session yet, create one
    if (!sessionId) {
      setIsCreatingSession(true);
      try {
        // Create a new session
        const createResponse = await fetch("/api/internal-chat/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatInstanceIds: selectedConversations.map(c => c.id),
            title: selectedConversations.length === 1 
              ? selectedConversations[0].title 
              : `Analysis of ${selectedConversations.length} conversations`
          })
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error("Failed to create analysis session");
        }
        
        const createData = await createResponse.json();
        
        // Process context for all selected conversations
        const contextResponse = await fetch("/api/internal-chat/process-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: createData.session.id,
            chatInstanceIds: selectedConversations.map(c => c.id)
          })
        });
        
        if (!contextResponse.ok) {
          const errorText = await contextResponse.text();
          throw new Error("Failed to process context data");
        }
        
        // Set the session ID and mark first message sent
        const newSessionId = createData.session.id;
        setSessionId(newSessionId);
        setFirstMessageSent(true);
        
        // Use setTimeout to ensure state updates before submitting
        setTimeout(() => {
          // Set input and submit with the AI SDK
          setInput(message);
          
          // Create a proper form event
          const mockEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
          
          // Submit using the AI SDK's handleSubmit
          handleSubmit(mockEvent);
          
          // Clear input after submission
          setInput("");
        }, 300);
        
      } catch (error) {
        console.error("Error in session creation:", error);
      } finally {
        setIsCreatingSession(false);
      }
    } else {
      // For an existing session, use the AI SDK directly
      // Set the input value
      setInput(message);
      
      // Create a form event
      const mockEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
      
      // Submit using the AI SDK
      handleSubmit(mockEvent);
      
      // Clear input
      setInput("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
        {/* Welcome message when no messages exist yet */}
        {messages.length === 0 && !isCreatingSession && !firstMessageSent && (
          <>
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-6">
              Click "Add Responses" to select the data you'd like to include in the AI context and start chatting!
              </p>
            </div>
            <div className="mt-12">
              <PromptSuggestions 
                suggestions={promptSuggestionsList} 
                onSuggestionClick={handleSuggestionClick} 
              />
            </div>
          </>
        )}
        
        {/* Creating session indicator */}
        {isCreatingSession && (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">
              Creating analysis session...
            </p>
          </div>
        )}
        
        {/* Session exists but no messages yet - empty state */}
        {sessionId && messages.length === 0 && !isCreatingSession && (
          <div></div>
        )}

        {/* Messages container */}
        <div className="mx-auto max-w-4xl space-y-8 py-8">
          {/* Show all messages */}
          {messageElements}
          
          {/* Show typing animation when waiting for AI response */}
          {loadingIndicator}
          
          {/* Quota exceeded message */}
          {!isQuotaLoading && !hasAvailableQAQuota && (
            <div className="flex justify-center w-full my-8">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-sm flex items-start gap-2 max-w-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p>You've run out of Response Q&A credits. Please upgrade your plan to continue.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* End of messages marker for scrolling */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Error display */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm mx-auto max-w-4xl">
            <p className="font-medium">Error</p>
            <p>{error.message}</p>
          </div>
        )}
      </div>

      {/* Chat input with conversation selector */}
      <div className="sticky bottom-0">
        {!isQuotaLoading && !hasAvailableQAQuota ? (
          <div className="py-3 px-4 bg-gray-100 text-gray-500 text-sm flex items-center justify-center border-t border-gray-200">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            You've run out of Response Q&A credits. Please upgrade your plan to continue.
          </div>
        ) : (
          <ChatInput 
            selectedConversations={selectedConversations}
            onConversationSelect={handleConversationSelect}
            onConversationRemove={handleConversationRemove}
            onMessageSubmit={(message) => {
              // Only submit if quota is available
              if (hasAvailableQAQuota) {
                handleMessageSubmit(message);
              }
            }}
            isSubmitting={isChatLoading || isCreatingSession}
            firstMessageSent={firstMessageSent}
            value={input}
            onChange={handleInputChange}
            sessionId={sessionId}
          />
        )}
      </div>
    </div>
  )
}