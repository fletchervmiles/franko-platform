"use client"

import { useState, useEffect } from "react"
import { Message } from "ai"
import { useChat } from "ai/react"
import { ChatInput } from "@/components/response-qa-input"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Conversation {
  id: string
  title: string
  responseCount: number
  wordCount: number
}

interface ResponseQALandingProps {
  userId: string
}

export function ResponseQALanding({ userId }: ResponseQALandingProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversations, setSelectedConversations] = useState<Conversation[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const router = useRouter()

  // Fetch available conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        // Fetch chat instances that have responses
        const response = await fetch("/api/chat-instances/with-responses")
        if (!response.ok) throw new Error("Failed to fetch conversations")
        
        const data = await response.json()
        setConversations(data.conversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const handleConversationSelect = (conversation: Conversation) => {
    // Add to selected if not already selected
    if (!selectedConversations.some(c => c.id === conversation.id)) {
      setSelectedConversations(prev => [...prev, conversation])
    }
  }

  const handleConversationRemove = (conversationId: string) => {
    setSelectedConversations(prev => prev.filter(c => c.id !== conversationId))
  }

  const handleMessageSubmit = async (message: string) => {
    if (selectedConversations.length === 0) {
      // Show error - need to select conversations first
      return
    }

    // If we don't have a session yet, create one
    if (!sessionId) {
      setIsLoading(true)
      try {
        // Just pass the chat instance IDs and let the API handle finding responses
        const createResponse = await fetch("/api/internal-chat/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatInstanceIds: selectedConversations.map(c => c.id)
          })
        })
        
        if (!createResponse.ok) throw new Error("Failed to create analysis session")
        
        const { session } = await createResponse.json()
        setSessionId(session.id)
        
        // Navigate to the new session
        router.push(`/response-qa/${session.id}`)
      } catch (error) {
        console.error("Error creating session:", error)
        setIsLoading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-muted/30 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No conversations found</h3>
          <p className="text-muted-foreground mb-6">
            You need to create conversations and collect responses before you can use the response analysis tool.
          </p>
          <Button onClick={() => router.push("/workspace")}>
            Go to Workspace
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-14">
        <div className="mx-auto max-w-4xl py-8">
          {selectedConversations.length === 0 ? (
            <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">Get started with response analysis</h3>
              <p className="text-muted-foreground mb-4">
                Select conversations using the "Add Responses" button below to start analyzing your data.
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">Ready to analyze</h3>
              <p className="text-muted-foreground mb-4">
                You've selected {selectedConversations.length} conversation(s). Ask a question to start your analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat input with conversation selector */}
      <div className="sticky bottom-0">
        <ChatInput 
          conversations={conversations}
          selectedConversations={selectedConversations}
          onConversationSelect={handleConversationSelect}
          onConversationRemove={handleConversationRemove}
          onMessageSubmit={handleMessageSubmit}
          isSubmitting={isLoading}
        />
      </div>
    </div>
  )
}