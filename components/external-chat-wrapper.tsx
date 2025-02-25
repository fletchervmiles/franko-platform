"use client"

import { Suspense } from "react"
import { Message } from "ai"
import { ExternalChat } from "@/components/external-chat"
import { Loader2 } from "lucide-react"

interface ExternalChatWrapperProps {
  chatInstanceId: string
  chatResponseId: string
  initialMessages: Message[]
  organizationName: string
  organizationContext: string
}

export function ExternalChatWrapper({
  chatInstanceId,
  chatResponseId,
  initialMessages,
  organizationName,
  organizationContext
}: ExternalChatWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading chat...</p>
          </div>
        </div>
      }
    >
      <ExternalChat
        chatInstanceId={chatInstanceId}
        chatResponseId={chatResponseId}
        initialMessages={initialMessages}
        organizationName={organizationName}
        organizationContext={organizationContext}
      />
    </Suspense>
  )
} 