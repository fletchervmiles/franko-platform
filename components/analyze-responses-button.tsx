"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Brain, Loader2 } from "lucide-react"
import { toast } from "./ui/use-toast"

interface AnalyzeResponsesButtonProps {
  chatInstanceId: string
  responseCount: number
}

export function AnalyzeResponsesButton({ chatInstanceId, responseCount }: AnalyzeResponsesButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (responseCount === 0) {
      toast({
        title: "No responses to analyze",
        description: "This conversation has no responses yet. Collect some responses first.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch("/api/internal-chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInstanceId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create analysis session")
      }

      const { session } = await response.json()
      
      // Navigate to the analysis session
      router.push(`/response-qa/${session.id}`)
    } catch (error) {
      console.error("Error creating analysis session:", error)
      toast({
        title: "Failed to create analysis session",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || responseCount === 0}
      className="gap-2"
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Brain className="h-4 w-4" />
      )}
      {isLoading ? "Creating..." : "Analyze Responses"}
    </Button>
  )
}