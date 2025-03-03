"use client"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { Message } from "ai"
import { useChat } from "ai/react"
import { Message as ChatMessage } from "./message"
import { ChatInput } from "./input"
import { Loader2, ArrowRight } from "lucide-react"
import { TopicGrid } from "./TopicGrid"
import { ConversationProgress } from "./conversation-progress"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "./ui/button"

interface ChatProps {
  conversationId: string
  initialMessages?: Message[]
  chatInstanceId?: string
}

export function Chat({ conversationId, initialMessages = [], chatInstanceId }: ChatProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Comment out showProgressBar state - we'll always set it to false
  // const [showProgressBar, setShowProgressBar] = useState(false)
  
  const [hasSelectedTopic, setHasSelectedTopic] = useState(false)
  const [isStarted, setIsStarted] = useState(!!initialMessages.length)

  // Initialize chat with AI SDK's useChat hook
  const { 
    messages,
    handleSubmit,
    input,
    setInput,
    isLoading,
    stop,
    setMessages,
    error
  } = useChat({
    id: conversationId,
    body: { id: conversationId, chatInstanceId },
    initialMessages,
    // maxSteps allows the model to make multiple steps in a single turn
    // This is essential for tool usage, as it allows the model to:
    // 1. Call a tool
    // 2. Receive the tool's result
    // 3. Generate a brief follow-up response
    // Setting this to 10 allows complex multi-step interactions
    maxSteps: 2,
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
            router.push('/thank-you');
          }, delayMs);
        }
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Something went wrong. Please try again.");
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

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  }, [error]);

  const handleTopicSelect = (prompt: string) => {
    setHasSelectedTopic(true)
    setIsStarted(true)
  }

  const handleGetStarted = () => {
    setIsStarted(true)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Comment out the effect hook that sets showProgressBar
  /*
  useEffect(() => {
    // Show progress bar as soon as there's at least one message
    if (messages.length > 0 && !showProgressBar) {
      setShowProgressBar(true)
    }
  }, [messages.length, showProgressBar])
  */

  // Show welcome screen with "Get Started" button if not started
  if (!isStarted) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 flex items-center justify-center">
          <div className="mx-auto max-w-3xl w-full text-center">
            <h1 className="text-3xl font-bold mb-6">Welcome to the Interview</h1>
            <p className="text-lg mb-8">Thank you for participating in this conversation. Your insights are valuable to us.</p>
            <Button 
              onClick={handleGetStarted} 
              size="lg" 
              className="mx-auto"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
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
          {messages.map((message, index) => {
            // Determine if this message is the first in a turn
            const isFirstInTurn = index === 0 || 
              // If previous message was from a different role, this is first in turn
              messages[index - 1]?.role !== message.role;
              
            return (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.role === "user"}
                toolInvocations={message.toolInvocations}
                chatId={conversationId}
                isLoading={isLoading && index === messages.length - 1 && message.role !== "user"}
                messageIndex={index}
                allMessages={messages}
                isFirstInTurn={isFirstInTurn}
              />
            );
          })}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ChatMessage
              content=""
              isUser={false}
              chatId={conversationId}
              isLoading={true}
              messageIndex={-1}
              allMessages={[]}
              isFirstInTurn={true}
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
          showProgressBar={false}
          progressBar={null}
          stop={stop}
        />
      </div>
    </div>
  )
}

