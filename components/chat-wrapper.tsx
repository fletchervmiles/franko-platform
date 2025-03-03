"use client"

import { Message } from "ai"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Import the loading component directly
function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-400" />
        <p className="text-sm text-gray-500">Loading chat...</p>
      </div>
    </div>
  )
}

// Dynamically import the Chat component
const Chat = dynamic(() => import("@/components/chat").then(mod => ({ default: mod.Chat })), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

interface ChatWrapperProps {
  conversationId: string
  initialMessages: Message[]
  chatInstanceId?: string
}

export function ChatWrapper({ conversationId, initialMessages, chatInstanceId }: ChatWrapperProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Chat conversationId={conversationId} initialMessages={initialMessages} chatInstanceId={chatInstanceId} />
    </Suspense>
  )
} 