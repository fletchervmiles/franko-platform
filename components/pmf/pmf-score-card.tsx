"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useFeedback } from "@/contexts/feedback-context"

// Custom Progress component that allows direct color control
function CustomProgress({ value, className, color }: { value: number; className?: string; color: string }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-100", className)}>
      <div
        className="h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}

export function PMFScoreCard() {
  const { pmfScore, isLoading, sampleSize, confidenceLevel } = useFeedback()
  const [progress, setProgress] = useState(0)

  // Animate the progress bar on mount and when pmfScore changes
  useEffect(() => {
    const timer = setTimeout(() => setProgress(pmfScore), 100)
    return () => clearTimeout(timer)
  }, [pmfScore])

  // Determine label and description based on percentage
  const getStatusInfo = (value: number) => {
    if (value < 10) {
      return {
        label: "Work to Do",
        description: "This stage is early. Continue exploring user needs and refining your solution.",
      }
    } else if (value < 20) {
      return {
        label: "Potential",
        description: "There are signs of interest. Focus on deepening product relevance.",
      }
    } else if (value < 30) {
      return {
        label: "Developing",
        description: "Progress is underway. Some users are starting to find real value.",
      }
    } else if (value < 40) {
      return {
        label: "Emergent",
        description: "Traction is building. Clear market signals are starting to show.",
      }
    } else {
      return {
        label: "Established",
        description: "Product-market fit is confirmed. Core users rely on your product.",
      }
    }
  }

  const statusInfo = getStatusInfo(pmfScore)

  // Get the actual color value for the progress bar
  const getProgressColorValue = (value: number) => {
    if (value < 10) return "rgb(75, 85, 99)" // gray-600
    if (value < 20) return "rgb(37, 99, 235)" // blue-600
    if (value < 30) return "rgb(29, 78, 216)" // blue-700
    if (value < 40) return "rgb(30, 64, 175)" // blue-800
    return "#11b980" // Green color for Established
  }

  // Get text color for label based on percentage
  const getLabelColor = (value: number) => {
    if (value < 10) return "text-gray-600"
    if (value < 20) return "text-blue-600"
    if (value < 30) return "text-blue-700"
    if (value < 40) return "text-blue-800"
    return "text-[#11b980]" // Green color for Established
  }

  return (
    <Card className="border shadow-sm rounded-[6px] bg-white font-sans">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">PMF Score</CardTitle>
        </div>
        {/* TODO: Replace "Cursor" with dynamic organisation_name from profiles-schema file when migrating */}
        <p className="text-sm text-gray-500">
          % of users who would be "very disappointed" if they could no longer use Cursor
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end justify-between w-full py-3">
              <div className="w-full flex items-baseline justify-between">
                <span className="text-5xl font-semibold text-gray-800">{pmfScore}%</span>
                <div className="flex items-center gap-1">
                  <span className={cn("text-base font-medium", getLabelColor(pmfScore))}>{statusInfo.label}</span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="rounded-full p-1 hover:bg-gray-100">
                          <Info className={cn("h-4 w-4", getLabelColor(pmfScore))} />
                          <span className="sr-only">PMF Score Information</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-black text-white border-black max-w-xs">
                        <p>{statusInfo.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div className="space-y-1 relative">
              {/* 40% threshold dotted line */}
              <div className="absolute" style={{ left: "40%", zIndex: 10, top: 0 }}>
                <div
                  className="h-4 w-0"
                  style={{
                    borderLeft: "1px dotted rgba(156, 163, 175, 0.5)",
                  }}
                ></div>
              </div>

              <CustomProgress value={progress} color={getProgressColorValue(pmfScore)} />

              <div className="flex justify-between text-xs text-gray-500 py-3 relative">
                <span>0%</span>
                {/* 40% threshold text */}
                <span className="absolute text-xs text-gray-500" style={{ left: "40%", transform: "translateX(-50%)" }}>
                  40% PMF Threshold
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Confidence level indicator - more prominent */}
            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <span className="text-sm text-gray-600">Confidence:</span>
                      <span className={cn("px-2 py-1 rounded-md text-sm font-medium", confidenceLevel.color)}>
                        {confidenceLevel.level}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white border-black max-w-xs">
                    <p>
                      {confidenceLevel.description} • Based on {sampleSize} responses
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-gray-500">{sampleSize} responses</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
