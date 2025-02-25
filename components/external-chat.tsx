"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { Message } from "ai"
import { useChat } from "ai/react"
import { Message as ChatMessage } from "./message"
import { ChatInput } from "./input"
import { ExternalChatProgress } from "./external-chat-progress"

interface ExternalChatProps {
  chatInstanceId: string
  chatResponseId: string
  initialMessages: Message[]
  organizationName: string
  organizationContext: string
}

export function ExternalChat({
  chatInstanceId,
  chatResponseId,
  initialMessages = [],
  organizationName,
  organizationContext
}: ExternalChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showProgressBar, setShowProgressBar] = useState(false)

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
    api: "/api/external-chat",
    id: chatResponseId,
    body: { 
      chatInstanceId,
      chatResponseId,
      organizationName,
      organizationContext
    },
    initialMessages,
    onFinish: (message) => {
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
        e.preventDefault()
        e.returnValue = 'Your progress will be lost if you leave.'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showProgressBar])

  useEffect(() => {
    if (messages.length > 0 && !showProgressBar) {
      setShowProgressBar(true)
    }
  }, [messages.length, showProgressBar])

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
              chatId={chatResponseId}
              isLoading={isLoading && index === messages.length - 1 && message.role !== "user"}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ChatMessage
              content=""
              isUser={false}
              chatId={chatResponseId}
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
            <ExternalChatProgress 
              chatResponseId={chatResponseId}
              messageCount={messages.length}
            />
          }
          stop={stop}
        />
      </div>
    </div>
  )
} 