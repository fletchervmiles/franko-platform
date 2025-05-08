"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useFeedback } from "@/contexts/persona-context"
import { toast } from "@/components/ui/use-toast"
import { InfoIcon as InfoCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface AddPersonaModalProps {
  isOpen: boolean
  onClose: () => void
  canAddMore: boolean
}

export function AddPersonaModal({ isOpen, onClose, canAddMore }: AddPersonaModalProps) {
  const { addPersona, personas } = useFeedback()
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<{ label?: string; description?: string }>({})

  // Validate form
  const validate = () => {
    const newErrors: { label?: string; description?: string } = {}

    if (!label.trim()) {
      newErrors.label = "Label is required"
    } else if (label.trim().split(/\s+/).length > 3) {
      newErrors.label = "Label should be 3 words or less"
    } else if (personas.some((p) => p.isActive && p.label.toLowerCase() === label.trim().toLowerCase())) {
      newErrors.label = "A persona with this label already exists"
    }

    if (description.length > 120) {
      newErrors.description = "Description should be 120 characters or less"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!canAddMore) {
      toast({
        title: "Cannot add persona",
        description: "You've reached the maximum of 5 active personas. Archive or merge existing personas to add more.",
        variant: "destructive",
      })
      onClose()
      return
    }

    if (validate()) {
      addPersona({
        label: label.trim(),
        description: description.trim(),
      })

      toast({
        title: "Persona added",
        description: "The new persona has been added successfully.",
      })

      // Reset form and close modal
      setLabel("")
      setDescription("")
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Add Persona</DialogTitle>
          <DialogDescription>Create a new persona to categorize your users.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="label">Label</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Keep it short & recognizable. This label will appear on all dashboards.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Startup CTO"
              className={errors.label ? "border-red-500" : ""}
            />
            {errors.label && <p className="text-red-500 text-xs">{errors.label}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical lead at early-stage SaaS."
              className={errors.description ? "border-red-500" : ""}
              maxLength={120}
            />
            <div className="flex justify-between">
              {errors.description ? (
                <p className="text-red-500 text-xs">{errors.description}</p>
              ) : (
                <span className="text-xs text-gray-500">{description.length}/120 characters</span>
              )}
            </div>
          </div>

          {!canAddMore && (
            <p className="text-amber-600 text-sm bg-amber-50 p-2 rounded">
              Max 5 active personas. Archive or merge existing ones to add more.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canAddMore}>
            Add Persona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
