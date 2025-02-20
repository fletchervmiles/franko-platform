"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export function CreateChatButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateChat = async () => {
    try {
      setIsLoading(true)
      
      // Create chat via API
      const response = await fetch("/api/chats/create", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create chat")
      }

      const { id } = await response.json()
      
      // Navigate to the new chat
      router.push(`/chat/${id}`)
    } catch (error) {
      console.error("Failed to create chat:", error)
      toast.error("Failed to create chat. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCreateChat}
      disabled={isLoading}
      size="sm"
      className="bg-black text-white hover:bg-gray-800"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="mr-1 h-3 w-3" />
          Create Conversation
        </>
      )}
    </Button>
  )
} 