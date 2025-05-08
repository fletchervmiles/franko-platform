"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFeedback } from "@/contexts/persona-context"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface MergePersonaModalProps {
  isOpen: boolean
  onClose: () => void
  sourcePersonaId: string | null
}

export function MergePersonaModal({ isOpen, onClose, sourcePersonaId }: MergePersonaModalProps) {
  const { personas, mergePersonas } = useFeedback()
  const [targetPersonaId, setTargetPersonaId] = useState<string>("")

  // Reset target selection when source changes
  useEffect(() => {
    setTargetPersonaId("")
  }, [sourcePersonaId])

  // Get source persona details
  const sourcePersona = personas.find((p) => p.id === sourcePersonaId)

  // Get available target personas (excluding source)
  const availableTargets = personas.filter((p) => p.isActive && p.id !== sourcePersonaId)

  // Handle merge
  const handleMerge = () => {
    if (!sourcePersonaId || !targetPersonaId) return

    mergePersonas(sourcePersonaId, targetPersonaId)

    toast({
      title: "Personas merged",
      description: `Interviews from "${sourcePersona?.label}" have been merged into the selected persona.`,
    })

    onClose()
  }

  if (!sourcePersona) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Merge Persona</DialogTitle>
          <DialogDescription>
            Merge "{sourcePersona.label}" into another persona. This will move all tagged interviews to the target
            persona.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source Persona</Label>
            <div className="p-2 border rounded-md bg-gray-50">
              <p className="font-medium">{sourcePersona.label}</p>
              <p className="text-sm text-gray-500 mt-1">{sourcePersona.description || "No description"}</p>
              <p className="text-sm text-gray-500 mt-1">{sourcePersona.interviewCount} interviews</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target Persona</Label>
            <Select value={targetPersonaId} onValueChange={setTargetPersonaId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a target persona" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    {persona.label} ({persona.interviewCount} interviews)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {targetPersonaId && (
              <div className="p-2 border rounded-md bg-gray-50 mt-2">
                <p className="text-sm">
                  <span className="font-medium">{sourcePersona.interviewCount} interviews</span> will move from{" "}
                  <span className="font-medium">{sourcePersona.label}</span> →{" "}
                  <span className="font-medium">{personas.find((p) => p.id === targetPersonaId)?.label}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={!targetPersonaId}>
            Merge Personas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
