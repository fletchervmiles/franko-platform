"use client"
import { Chat } from "@/components/chat"
import { NavSidebar } from "@/components/nav-sidebar"

export default function CreatePage() {
  const conversationId = "placeholder-id"

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12">
        <div className="h-[calc(100vh-12rem)]">
          <Chat conversationId={conversationId} />
        </div>
      </div>
    </NavSidebar>
  )
}