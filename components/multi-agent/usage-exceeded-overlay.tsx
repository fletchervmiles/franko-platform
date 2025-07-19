"use client"

import { AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface UsageExceededOverlayProps {
  currentTheme?: "light" | "dark"
  className?: string
}

export function UsageExceededOverlay({ 
  currentTheme = "light", 
  className 
}: UsageExceededOverlayProps) {
  return (
    <div className={cn(
      "absolute inset-0 z-50 flex items-center justify-center",
      "bg-black/40 backdrop-blur-sm",
      className
    )}>
      <Card className={cn(
        "p-6 m-4 max-w-md text-center shadow-lg",
        currentTheme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            currentTheme === "dark" ? "bg-amber-900/20" : "bg-amber-50"
          )}>
            <AlertTriangle className={cn(
              "h-6 w-6",
              currentTheme === "dark" ? "text-amber-400" : "text-amber-600"
            )} />
          </div>
          
          <div className="space-y-2">
            <h3 className={cn(
              "text-lg font-semibold",
              currentTheme === "dark" ? "text-white" : "text-gray-900"
            )}>
              Temporarily Unavailable
            </h3>
            
            <p className={cn(
              "text-sm leading-relaxed",
              currentTheme === "dark" ? "text-gray-300" : "text-gray-600"
            )}>
              This conversation is temporarily unavailable due to account limits. 
              Please check back soon or contact support if this continues.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
} 