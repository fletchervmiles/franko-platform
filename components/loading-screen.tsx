"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface LoadingScreenProps {
  message?: string;
  progress?: string;
  disableCycling?: boolean;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [dots, setDots] = useState(".")
  
  // Handle progress bar filling over 30 seconds
  useEffect(() => {
    const startTime = Date.now()
    const duration = 50000 // 50 seconds
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(100, Math.floor((elapsed / duration) * 100))
      
      setProgress(newProgress)
      
      if (newProgress >= 100) {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  // Handle animated dots after completion
  useEffect(() => {
    if (!isComplete) return
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === ".") return ".."
        if (prev === "..") return "..."
        return "."
      })
      }, 500)

    return () => clearInterval(interval)
  }, [isComplete])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="max-w-xl mx-auto p-8 rounded-lg shadow-sm border bg-card text-card-foreground">
        <div className="flex flex-col items-center space-y-8">
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          </div>

          <h2 className="text-2xl font-semibold text-center">
            {!isComplete ? "Generating your Conversation Plan..." : `Finalising now${dots}`}
          </h2>

          {isComplete && (
            <p className="text-center text-sm text-amber-500 mt-4">
              Thank you for your patience—this is taking slightly longer than usual, but the good news is that it means the model is thinking deeply about your conversation plan!            </p>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-6">
              Your plan will include step-by-step instructions to help guide your conversational agent, including:
            </p>

            <div className="flex justify-center w-full">
              <div className="inline-block space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span>Conversation Objectives</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span>Desired learning outcomes</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span>Agent guidance</span>
                </div>
              </div>
            </div>
        </div>

          <div className="text-center text-sm text-muted-foreground space-y-4 w-full px-4">
            <p>You'll be able to review and edit before sending.</p>

            <p>
              Once ready, get your shareable link under the <span className="font-medium text-blue-500">Share</span>{" "}
              tab—ready to send to your customers.
            </p>
          </div>

          <div className="w-full space-y-2 pt-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress:</span>
              <span>{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-3 bg-blue-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen;