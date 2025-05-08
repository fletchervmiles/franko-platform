"use client"

import type React from "react"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface EditDescriptionPopoverProps {
  description: string
  onSave: (description: string) => void
  children: React.ReactNode
}

export function EditDescriptionPopover({ description, onSave, children }: EditDescriptionPopoverProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(description)

  const handleSave = () => {
    onSave(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 bg-white dark:bg-gray-950">
        <div className="space-y-4">
          <h4 className="font-medium">Edit Description</h4>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a description for this persona..."
            className="min-h-[100px]"
            maxLength={120}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{value.length}/120 characters</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
