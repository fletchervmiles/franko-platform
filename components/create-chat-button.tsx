"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export function CreateChatButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateChat = () => {
    try {
      setIsLoading(true)
      
      // Navigate directly to the create form page
      router.push('/create/new')
    } catch (error) {
      console.error("Failed to navigate to create page:", error)
      toast.error("Failed to navigate to create page. Please try again.")
    } finally {
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
          Loading...
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