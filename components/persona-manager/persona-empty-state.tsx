"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface PersonaEmptyStateProps {
  onAddClick: () => void
}

export function PersonaEmptyState({ onAddClick }: PersonaEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <h3 className="text-lg font-medium text-gray-700">No personas yet</h3>
        <p className="text-gray-500 text-center max-w-md">Add at least one so the AI can tag future interviews.</p>
        <Button onClick={onAddClick}>Add Persona</Button>
      </CardContent>
    </Card>
  )
}
