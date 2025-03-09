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
    console.log("🔍 Initialization effect running with:", { 
      existingSessionId, 
      sessionId, 
      hasExistingConversation: !!existingConversation,
      selectedConversationsCount: selectedConversations.length 
    });
    
    if (existingSessionId && !sessionId) {
      console.log("📝 Setting session ID from existingSessionId:", existingSessionId);
      setSessionId(existingSessionId);
      setFirstMessageSent(true);
    }
    
    if (existingConversation && selectedConversations.length === 0) {
      console.log("📝 Setting selected conversations from existingConversation");
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
    },
    onResponse: (response) => {
      console.log("🔄 useChat onResponse called:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
    },
    onFinish: (message) => {
      console.log("✅ useChat onFinish called with message:", message);
    },
    onError: (error) => {
      console.error("❌ useChat onError called:", error);
    }
  });

  // Fix for the issue where new messages aren't being sent
  // This manually adds a test message when a new session is created
  useEffect(() => {
    let isNewlyCreatedSession = false;
    
    // Only run this if we have a session ID, but no messages yet
    if (sessionId && messages.length === 0 && firstMessageSent) {
      isNewlyCreatedSession = true;
      console.log("🔧 DEBUG: Newly created session detected:", sessionId);
    
      
      // Add directly to messages
      setMessages([
        {
          id: Date.now().toString(),
          role: 'user',
          content: testMessage
        }
      ]);
    }
    
    // Only for debugging - remove in production
    return () => {
      if (isNewlyCreatedSession) {
        console.log("🔧 DEBUG: Effect cleanup for newly created session");
      }
    };
  }, [sessionId, messages.length, firstMessageSent, setMessages]);

  // Log important state changes to help debug
  useEffect(() => {
    console.log("🔄 messages state changed:", messages.map(m => ({
      id: m.id,
      role: m.role,
      contentPreview: typeof m.content === 'string' 
        ? m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '') 
        : '[complex content]'
    })));
    
    // Debug messages received from the useChat hook
    console.log("🔍 DETAILED MESSAGES DEBUG:", {
      messagesLength: messages.length,
      messagesData: messages,
      isChatLoading,
      useChatMessages: Array.isArray(messages) ? messages : 'not an array',
      messageComponentProps: messages.map((message, index) => ({
        key: message.id || index,
        content: typeof message.content === 'string' 
          ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
          : '[complex content]',
        isUser: message.role === "user",
        chatId: sessionId || '',
        isLoading: index === messages.length - 1 && message.role === 'assistant' && isChatLoading,
        messageIndex: index
      }))
    });
  }, [messages, isChatLoading, sessionId]);

  useEffect(() => {
    console.log("🔄 isChatLoading changed to:", isChatLoading);
  }, [isChatLoading]);

  useEffect(() => {
    console.log("🔄 sessionId changed to:", sessionId);
  }, [sessionId]);

  // Memoize the message elements to avoid re-renders
  const messageElements = useMemo(() => {
    console.log("📊 Rendering message elements, count:", messages.length);
    
    if (messages.length === 0) {
      return null;
    }
    
    return messages.map((message, index) => {
      console.log(`📊 Rendering message ${index}:`, {
        id: message.id,
        role: message.role,
        contentPreview: typeof message.content === 'string' 
          ? message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
          : '[complex content]'
      });
      
      return (
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
      );
    });
  }, [messages, sessionId, isChatLoading]);

  // Memoize the loading indicator
  const loadingIndicator = useMemo(() => {
    if (!isChatLoading || messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return null;
    }
    
    console.log("🔄 Rendering loading indicator");
    
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
    scrollToBottom();
  }, [messages.length]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleConversationSelect = (conversation: Conversation, existingSessionId?: string) => {
    // Add to selected if not already selected
    if (!selectedConversations.some(c => c.id === conversation.id)) {
      setSelectedConversations(prev => [...prev, conversation])
      
      // If a session ID was provided, set it
      if (existingSessionId) {
        setSessionId(existingSessionId)
        setFirstMessageSent(true) // Mark as first message sent to prevent removal
      }
    }
  }

  const handleConversationRemove = (conversationId: string) => {
    // Only allow removing if first message hasn't been sent
    if (!firstMessageSent) {
      setSelectedConversations(prev => prev.filter(c => c.id !== conversationId))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle message submission with the AI SDK
  const handleMessageSubmit = async (message: string) => {
    console.log("🚀 handleMessageSubmit called with message:", message);
    
    if (selectedConversations.length === 0) {
      console.warn("❌ No conversations selected, cannot submit message");
      return;
    }

    console.log("📊 Current state before submission:", {
      sessionId,
      hasSession: !!sessionId,
      selectedConversations: selectedConversations.map(c => c.id),
      firstMessageSent
    });

    // If we don't have a session yet, create one
    if (!sessionId) {
      setIsCreatingSession(true);
      console.log("📝 No session ID found, creating new session...");
      try {
        // Create a new session
        console.log("📤 Creating session with chat instances:", selectedConversations.map(c => c.id));
        
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
          console.error("❌ Session creation failed:", { 
            status: createResponse.status, 
            statusText: createResponse.statusText,
            responseText: errorText
          });
          throw new Error("Failed to create analysis session");
        }
        
        const createData = await createResponse.json();
        console.log("✅ Session created successfully:", createData);
        
        // Process context for all selected conversations
        console.log("📤 Processing context for session:", createData.session.id);
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
          console.error("❌ Context processing failed:", { 
            status: contextResponse.status, 
            statusText: contextResponse.statusText,
            responseText: errorText
          });
          throw new Error("Failed to process context data");
        }
        
        const contextData = await contextResponse.json();
        console.log("✅ Context processed successfully:", contextData);
        
        // Set the session ID and mark first message sent
        const newSessionId = createData.session.id;
        console.log("📝 Setting new session ID:", newSessionId);
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
        console.error("❌ Error in session creation flow:", error);
      } finally {
        setIsCreatingSession(false);
      }
    } else {
      // For an existing session, use the AI SDK directly
      console.log("📤 Submitting message with AI SDK");
      
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
        
        {/* Debug buttons - remove in production */}
        <div className="text-center mt-2 space-y-2">
          <button
            onClick={() => {
              console.log("🔧 DEBUG: Resetting form state");
              setSessionId(null);
              setFirstMessageSent(false);
              setMessages([]);
              setInput("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600 mr-4"
          >
            Reset Form (Debug)
          </button>

          <button
            onClick={() => {
              if (!sessionId) {
                console.error("No session ID available for direct API call");
                return;
              }
              
              console.log("🔧 DEBUG: Making direct API call with session:", sessionId);
              
              fetch("/api/internal-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [{ role: "user", content: "Debug test message" }],
                  internalChatSessionId: sessionId
                })
              })
              .then(response => {
                console.log("🔧 DEBUG: Direct API call response:", {
                  status: response.status,
                  ok: response.ok
                });
                return response.text();
              })
              .then(text => {
                console.log("🔧 DEBUG: Response text:", text.substring(0, 100) + (text.length > 100 ? "..." : ""));
              })
              .catch(error => {
                console.error("🔧 DEBUG: Direct API call error:", error);
              });
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Test Direct API Call (Debug)
          </button>
          
          <button
            onClick={() => {
              // Add a test message to the UI to see if message rendering works
              console.log("🔧 DEBUG: Adding test messages to UI");
              
              setMessages([
                {
                  id: "test-user-1",
                  role: "user",
                  content: "This is a test user message"
                },
                {
                  id: "test-assistant-1",
                  role: "assistant",
                  content: "This is a test assistant response"
                }
              ]);
            }}
            className="block mx-auto text-xs text-gray-400 hover:text-gray-600 mt-2"
          >
            Add Test Messages (Debug)
          </button>

          <button
            onClick={() => {
              // Force a complete reset and new useChat instance
              console.log("🔧 DEBUG: Forcing complete reset");
              
              // Clear all state
              setSessionId(null);
              setFirstMessageSent(false);
              setMessages([]);
              setInput("");
              
              // Force a reload of the page
              window.location.reload();
            }}
            className="block mx-auto text-xs text-red-400 hover:text-red-600 mt-2"
          >
            Force Reset & Reload (Debug)
          </button>
        </div>
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
        />
      </div>
    </div>
  )
}