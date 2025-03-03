/**
 * Start Chat Button Component
 * 
 * This client component handles the initialization of a new chat session:
 * 1. Creates a new chat response record in the database
 * 2. Initializes the chat with an "I'm ready to get started" message
 * 3. Redirects to the chat interface after initialization
 * 4. Provides loading and error states with retry functionality
 * 
 * This component is used on the landing page to start the conversation
 * when the user clicks the "Get Started" button.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Message } from "ai"
import { generateUUID } from "@/lib/utils"

interface StartChatButtonProps {
  chatInstanceId: string       // ID of the chat instance
  organizationName: string     // Name of the organization for context
  organizationContext: string  // Description of the organization for context
}

export function StartChatButton({
  chatInstanceId,
  organizationName,
  organizationContext
}: StartChatButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Function to initialize the chat session
  const initializeChat = async () => {
    setIsLoading(true)

    try {
      // Generate a unique ID for the chat response
      const chatResponseId = generateUUID()
      console.log("Initializing chat:", {
        chatResponseId,
        chatInstanceId,
        organizationName,
        organizationContext
      })
      
      // Create initial message
      const initialMessages: Message[] = [
        {
          id: generateUUID(),
          role: "user",
          content: "I'm ready to get started",
          createdAt: new Date()
        }
      ]

      console.log("Sending initialization request to /api/external-chat/initialize")
      
      // Create a new chat response record in the database
      const response = await fetch("/api/external-chat/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatResponseId,
          chatInstanceId,
          initialMessages,
          organizationName,
          organizationContext
        }),
      })

      console.log("Initialization response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Initialization error:", errorText)
        throw new Error(`Failed to initialize chat: ${errorText}`)
      }

      // Get the response data
      const data = await response.json()
      console.log("Initialization response data:", data)

      // Redirect to the chat interface
      console.log("Redirecting to:", `/${chatInstanceId}?chatResponseId=${chatResponseId}`)
      router.push(`/${chatInstanceId}?chatResponseId=${chatResponseId}`);
    } catch (error) {
      console.error("Detailed error initializing chat:", error)
      toast.error("Failed to start the conversation. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={initializeChat}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors w-full max-w-xs"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Preparing...</span>
        </>
      ) : (
        <span>Get Started</span>
      )}
    </button>
  )
} 