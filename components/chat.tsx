"use client"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { Message } from "ai"
import { useChat } from "ai/react"
import { Message as ChatMessage } from "./message"
import { ChatInput } from "./input"
import { ProgressBar, type Step } from "./progress-bar"
import { Loader2 } from "lucide-react"

const initialSteps: Step[] = [
  { label: "Intro", status: "in-review" },
  { label: "Discovery", status: "pending" },
  { label: "Review", status: "pending" },
  { label: "Finish", status: "pending" },
]

interface ChatProps {
  conversationId: string
  initialMessages?: Message[]
}

export function Chat({ conversationId, initialMessages = [] }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showProgressBar, setShowProgressBar] = useState(true)
  const [steps, setSteps] = useState(initialSteps)
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize chat with AI SDK's useChat hook
  const { 
    messages,      // Current messages (updated in real-time)
    handleSubmit,  // Handles form submission to route.ts
    input,         // Current input value
    setInput,      // Input setter
    isLoading,     // Loading state during processing
    stop          // Stop message generation
  } = useChat({
    id: conversationId,
    body: { id: conversationId },
    initialMessages,
    maxSteps: 10,  // Add maxSteps to enable multi-step tool calls
    onFinish: (message) => {
      window.history.replaceState({}, "", `/chat/${conversationId}`);
      
      // Check for COMPLETED end conversation calls
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showProgressBar])

  useEffect(() => {
    if (messages.length > 1 && !showProgressBar) {
      setShowProgressBar(true)
    }
  }, [messages, showProgressBar])

  // Update initialization state when component mounts and messages are loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

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
          steps={steps}
          stop={stop}
        />
      </div>
    </div>
  )
}

