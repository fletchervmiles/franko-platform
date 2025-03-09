"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Message, useChat } from "ai/react"
import { ChatInput } from "@/components/response-qa-input"
import { Message as MessageComponent } from "@/components/message"

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

export function ResponseQALanding({ 
  userId, 
  existingSessionId, 
  existingConversation 
}: ResponseQALandingProps) {
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
        {messages.length === 0 && !isCreatingSession && (
          <div className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Response Analysis</h2>
            <p className="text-muted-foreground mb-6">
              Select conversations below to analyze responses and identify patterns.
            </p>
          </div>
        )}
        
        {/* Creating session indicator */}
        {isCreatingSession && messages.length === 0 && (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">
              Creating analysis session...
            </p>
          </div>
        )}
        
        {/* Show welcome guidance once session exists but no messages yet */}
        {sessionId && messages.length === 0 && !isCreatingSession && (
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

        {/* Messages container */}
        <div className="mx-auto max-w-4xl space-y-8 py-8">
          {/* Show all messages */}
          {messageElements}
          
          {/* Show typing animation when waiting for AI response */}
          {loadingIndicator}
          
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
        <ChatInput 
          selectedConversations={selectedConversations}
          onConversationSelect={handleConversationSelect}
          onConversationRemove={handleConversationRemove}
          onMessageSubmit={handleMessageSubmit}
          isSubmitting={isChatLoading || isCreatingSession}
          firstMessageSent={firstMessageSent}
          value={input}
          onChange={handleInputChange}
          sessionId={sessionId}
        />
      </div>
    </div>
  )
}