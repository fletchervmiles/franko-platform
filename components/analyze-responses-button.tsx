"use client"

import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Brain } from "lucide-react"
import { toast } from "./ui/use-toast"

interface AnalyzeResponsesButtonProps {
  chatInstanceId: string
  responseCount: number
}

export function AnalyzeResponsesButton({ chatInstanceId, responseCount }: AnalyzeResponsesButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (responseCount === 0) {
      toast({
        title: "No responses to analyze",
        description: "This conversation has no responses yet. Collect some responses first.",
        variant: "destructive",
      })
      return
    }
    
    // Simply redirect to the response-qa page
    router.push(`/response-qa/`)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={responseCount === 0}
      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm px-3 py-1.5 transition-all duration-200 gap-2"
    >
      <Brain className="h-4 w-4" />
      Chat with Response Data
    </Button>
  )
}