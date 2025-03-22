"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string;
  progress?: string;
  disableCycling?: boolean;
}

export function LoadingScreen({ message, progress, disableCycling }: LoadingScreenProps) {
  const defaultMessages = [
    "Analyzing your objectives and context to design a tailored conversation plan...",
    "Defining an exploratory structure based on your desired outcomes...",
    "Crafting the guide to ensure an expert-level, discovery-focused approach...",
    "Aligning question style and tone to your organization's branding and voice...",
    "Almost ready—we're putting the final touches on your personalized conversation plan..."
  ];
  
  const loadingMessages = (message && disableCycling) 
    ? [message]
    : message 
      ? [message, ...defaultMessages]
      : defaultMessages;

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [fadeState, setFadeState] = useState("fade-in")

  useEffect(() => {
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
        <div className="mb-6 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
        </div>

        <div
          className={`text-center transition-opacity duration-500 min-h-[28px] ${
            fadeState === "fade-in" ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-gray-700">{loadingMessages[currentMessageIndex]}</p>
          
          {progress && (
            <p className="text-sm text-gray-500 mt-4">{progress}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen;