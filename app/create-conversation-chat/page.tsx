"use client"

import { Chat } from "@/components/chat-ui/chat"
import RootLayout from "@/components/custom-ui/nav"

export default function CreateConversationChatPage() {
  return (
    <RootLayout>
      <Chat conversationId="new" />
    </RootLayout>
  )
}
