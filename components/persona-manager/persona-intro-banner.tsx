"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PersonaIntroBannerProps {
  onDismiss: () => void
}

export function PersonaIntroBanner({ onDismiss }: PersonaIntroBannerProps) {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <div className="flex justify-between items-start">
        <AlertDescription className="text-blue-800 pr-4">
          <p className="font-medium mb-2">
            We've pre-seeded 3–5 key personas from your company data.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>
              <strong>What counts as a persona?</strong> Users who share the same role, context, and motivation.
            </li>
            <li>
              <strong>Auto-tagging:</strong> Each interview is automatically matched to one of these personas.
            </li>
            <li>
              <strong>Why care?</strong> Compare insights and PMF scores by persona to spot patterns fast.
            </li>
            <li>
              <strong>Tweak as needed:</strong> Rename, merge, or edit personas so they mirror your real segments.
            </li>
          </ul>
          <p className="text-xs italic mt-3">
            Note: the name and description you set are what the LLM uses when tagging interviews.
          </p>
        </AlertDescription>
        <Button variant="ghost" size="sm" onClick={onDismiss} className="text-blue-800 h-6 w-6 p-0 flex-shrink-0">
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </Alert>
  )
}
