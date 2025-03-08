"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, MessageSquare, ArrowRight, Loader2, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface InternalChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messagesJson: string
}

export function InternalChatSessionsList() {
  const [sessions, setSessions] = useState<InternalChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/internal-chat/sessions")
        
        if (!response.ok) {
          throw new Error("Failed to fetch sessions")
        }
        
        const data = await response.json()
        setSessions(data.sessions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        console.error("Error fetching sessions:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSessions()
  }, [])

  const handleContinueSession = (sessionId: string) => {
    router.push(`/response-qa/${sessionId}`)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading analysis sessions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-muted-foreground mb-6">No analysis sessions found.</p>
        <p className="text-muted-foreground mb-8">Start a new session by selecting responses from your workspace.</p>
        <Button onClick={() => router.push("/workspace")}>
          <Plus className="h-4 w-4 mr-2" />
          Go to Workspace
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => {
          // Parse messages to get count
          const messages = session.messagesJson ? JSON.parse(session.messagesJson) : []
          const messageCount = messages.length

          return (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{session.title}</CardTitle>
                <CardDescription className="flex items-center text-muted-foreground">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {session.updatedAt
                    ? `Updated ${formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}`
                    : `Created ${formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {messageCount} {messageCount === 1 ? "message" : "messages"}
                  </span>
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => handleContinueSession(session.id)}
                >
                  Continue Analysis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}