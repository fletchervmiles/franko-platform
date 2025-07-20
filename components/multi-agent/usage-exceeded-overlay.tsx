"use client"

import { PauseCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface UsageExceededOverlayProps {
  currentTheme?: "light" | "dark"
  className?: string
}

export function UsageExceededOverlay({ currentTheme = "light", className }: UsageExceededOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center",
        "bg-black/40 backdrop-blur-sm",
        className,
      )}
    >
      <Card
        className={cn(
          "p-6 m-4 max-w-md text-center shadow-lg",
          currentTheme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              currentTheme === "dark" ? "bg-blue-900/20" : "bg-blue-100",
            )}
          >
            <PauseCircle className={cn("h-6 w-6", currentTheme === "dark" ? "text-blue-400" : "text-blue-600")} />
          </div>
          <p className={cn("font-medium leading-relaxed", currentTheme === "dark" ? "text-gray-200" : "text-gray-800")}>
            Apologies, this feedback chat has reached its response limit for now. Please check back soon.
          </p>
        </div>
      </Card>
    </div>
  )
} 