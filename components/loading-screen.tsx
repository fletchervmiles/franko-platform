"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const loadingMessages = message 
    ? [message] 
    : [
      "Analyzing your objectives and context to design a tailored conversation plan...",
      "Defining an exploratory structure based on your desired outcomes...",
      "Crafting the guide to ensure an expert-level, discovery-focused approach...",
      "Aligning question style and tone to your organization's branding and voice...",
      "Almost ready—we're putting the final touches on your personalized conversation plan..."
    ]

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [fadeState, setFadeState] = useState("fade-in")

  useEffect(() => {
    // If there's only one message, don't cycle through messages
    if (loadingMessages.length <= 1) return;
    
    const interval = setInterval(() => {
      setFadeState("fade-out")
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex === loadingMessages.length - 1 ? 0 : prevIndex + 1))
        setFadeState("fade-in")
      }, 500)
    }, 4000)

    return () => clearInterval(interval)
  }, [loadingMessages.length])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="relative">
        {/* Loading indicator - using Loader2 for consistency */}
        <div className="mb-6 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
        </div>

        {/* Message container with fade transition */}
        <div
          className={`text-center transition-opacity duration-500 min-h-[28px] ${
            fadeState === "fade-in" ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-gray-700">{loadingMessages[currentMessageIndex]}</p>
        </div>
      </div>
    </div>
  )
}

// Also export as default for backward compatibility
export default LoadingScreen;