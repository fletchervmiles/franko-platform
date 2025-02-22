"use client"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { Message } from "ai"
import { useChat } from "ai/react"
import { Message as ChatMessage } from "./message"
import { ChatInput } from "./input"
import { Loader2 } from "lucide-react"
import { TopicGrid } from "./TopicGrid"
import { ConversationProgress } from "./conversation-progress"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ChatProps {
  conversationId: string
  initialMessages?: Message[]
}

export function Chat({ conversationId, initialMessages = [] }: ChatProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasSelectedTopic, setHasSelectedTopic] = useState(false)

  // Handle refresh detection and initialization
  useEffect(() => {
    const pageLoadKey = `chat-${conversationId}-loaded`
    const wasLoaded = sessionStorage.getItem(pageLoadKey)

    if (wasLoaded && initialMessages.length > 0) {
      // This is a refresh - redirect to workspace
      window.location.href = '/workspace'
      return
    }

    // Mark the page as loaded
    sessionStorage.setItem(pageLoadKey, 'true')

    // Start initialization if we're not redirecting
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 1000)

    return () => {
      clearTimeout(timer)
      // Clean up the flag when component unmounts
      sessionStorage.removeItem(pageLoadKey)
    }
  }, [conversationId, initialMessages.length])

  // Initialize chat with AI SDK's useChat hook
  const { 
    messages,
    handleSubmit,
    input,
    setInput,
    isLoading,
    stop,
    setMessages
  } = useChat({
    id: conversationId,
    body: { id: conversationId },
    initialMessages,
    maxSteps: 10,
    onFinish: (message) => {
      window.history.replaceState({}, "", `/chat/${conversationId}`);
      
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
  })

  // Show warning on refresh attempt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (messages.length > 0) {
        // Show warning dialog
        e.preventDefault()
        e.returnValue = 'Changes you made may not be saved.'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [messages.length])

  const handleTopicSelect = (prompt: string) => {
    setHasSelectedTopic(true)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showProgressBar])

  useEffect(() => {
    // Show progress bar as soon as there's at least one message
    if (messages.length > 0 && !showProgressBar) {
      setShowProgressBar(true)
    }
  }, [messages.length, showProgressBar])

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Initializing chat...</p>
        </div>
      </div>
    )
  }

  // Show centered layout with topic grid if no topic has been selected and no messages
  if (!hasSelectedTopic && messages.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 flex items-center">
          <div className="mx-auto max-w-3xl w-full">
            <TopicGrid 
              onTopicSelect={handleTopicSelect}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show chat layout after topic selection
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6 py-8">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isUser={message.role === "user"}
              toolInvocations={message.toolInvocations}
              chatId={conversationId}
              isLoading={isLoading && index === messages.length - 1 && message.role !== "user"}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ChatMessage
              content=""
              isUser={false}
              chatId={conversationId}
              isLoading={true}
            />
          )}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>
      
      <div className="flex-none w-full bg-white">
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          disabled={isLoading}
          showProgressBar={showProgressBar}
          progressBar={
            <ConversationProgress 
              conversationId={conversationId}
              messageCount={messages.length}
            />
          }
          stop={stop}
        />
      </div>
    </div>
  )
}

