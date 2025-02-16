"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Loader2, Check } from "lucide-react"

const mockSaveEmailNotification = async (enabled: boolean): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Email notification setting saved:", enabled)
      resolve()
    }, 1000)
  })
}

export function EmailNotificationSetting() {
  const [enabled, setEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked)
    setIsSaving(true)
    try {
      await mockSaveEmailNotification(checked)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error("Failed to save email notification setting:", error)
      // Revert the toggle if saving fails
      setEnabled(!checked)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Email Notifications
        </h3>
        <p className="text-sm text-gray-500">Receive email notifications when new responses are submitted.</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="email-notifications">Enable email notifications</Label>
        </div>
        <Switch
          id="email-notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isSaving}
          aria-label="Toggle email notifications"
          className="data-[state=checked]:bg-green-500"
        />
      </div>
      {(isSaving || isSaved) && (
        <div className="mt-2 text-sm">
          {isSaving && (
            <Button variant="outline" size="sm" disabled className="pointer-events-none">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </Button>
          )}
          {isSaved && (
            <Button variant="outline" size="sm" className="pointer-events-none text-green-600">
              <Check className="mr-2 h-4 w-4" />
              Saved
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

