"use client"

import type React from "react"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface EditLabelPopoverProps {
  personaId: string
  currentLabel: string
  onSave: (personaId: string, newLabel: string) => void
  children: React.ReactNode
  // Optional prop to check for existing labels during validation
  existingLabels?: string[]
}

export function EditLabelPopover({
  personaId,
  currentLabel,
  onSave,
  children,
  existingLabels = [],
}: EditLabelPopoverProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentLabel)
  const [error, setError] = useState<string | null>(null)

  const validate = (label: string): boolean => {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) {
      setError("Label cannot be empty.")
      return false
    }
    if (trimmedLabel.split(/\s+/).length > 3) {
      setError("Label should be 3 words or less.")
      return false
    }
    // Check for duplicates (case-insensitive), excluding the current persona's original label if unchanged
    const lowerCaseLabel = trimmedLabel.toLowerCase()
    if (
      lowerCaseLabel !== currentLabel.toLowerCase() &&
      existingLabels.some((l) => l.toLowerCase() === lowerCaseLabel)
    ) {
      setError("A persona with this label already exists.")
      return false
    }
    setError(null)
    return true
  }

  const handleSave = () => {
    const trimmedValue = value.trim()
    if (validate(trimmedValue)) {
      onSave(personaId, trimmedValue)
      setOpen(false)
      // Reset value in case popover is reopened for the same persona before a re-render
      // setValue(trimmedValue); // Keep the new value or reset to original? Let's keep it.
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset value and error when closing without saving
      setValue(currentLabel)
      setError(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 bg-white dark:bg-gray-950">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Edit Persona Label</h4>
          <div className="space-y-2">
            <Label htmlFor={`edit-label-${personaId}`}>Label</Label>
            <Input
              id={`edit-label-${personaId}`}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                // Basic validation on change can be added here if desired
                if (error) validate(e.target.value) // Re-validate to potentially clear error
              }}
              placeholder="Startup CTO"
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
          <div className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">
              Updating the persona label will update all responses currently tagged.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 