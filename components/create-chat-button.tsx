"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { useProfile } from "./contexts/profile-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

export function CreateChatButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { contextCompleted, isLoading: isProfileLoading } = useProfile()

  const handleCreateChat = () => {
    try {
      setIsLoading(true)
      
      // If context is not completed, redirect to context setup
      if (!contextCompleted) {
        router.push('/context-setup')
        toast.info("Please complete your context setup first.")
        return
      }
      
      // Navigate to the create form page
      router.push('/create/new')
    } catch (error) {
      console.error("Failed to navigate to create page:", error)
      toast.error("Failed to navigate to create page. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render the tooltip if profile is still loading
  if (isProfileLoading) {
    return (
      <Button
        disabled={true}
        size="sm"
        className="bg-black text-white opacity-70"
      >
        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        Loading...
      </Button>
    )
  }

  // Return button with tooltip if context is not completed
  if (!contextCompleted) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCreateChat}
              disabled={isLoading}
              size="sm"
              className="bg-black text-white hover:bg-gray-800 opacity-80"
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
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="bg-gray-800 text-white border-gray-800 p-3 max-w-xs">
            <p>Please set up your organization context before creating a conversation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Return normal button if context is completed
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