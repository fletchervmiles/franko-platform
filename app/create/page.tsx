"use client"
import { Chat } from "@/components/chat"
import { NavSidebar } from "@/components/nav-sidebar"

export default function CreatePage() {
  const conversationId = "placeholder-id"

  return (
    <NavSidebar>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-hidden">
          <Chat conversationId={conversationId} />
        </div>
      </div>
    </NavSidebar>
  )
}