"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Loader2 } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { toast } from "sonner"

export function NotificationsTab() {
  const { currentModal, isSaving, updateModal } = useSettings()
  const [enabled, setEnabled] = useState(true)
  const [initialEnabled, setInitialEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Load the current setting when the component mounts
  useEffect(() => {
    if (currentModal) {
      const currentSetting = currentModal.responseEmailNotifications !== false // Default to true unless explicitly false
      setEnabled(currentSetting)
      setInitialEnabled(currentSetting)
      setIsLoading(false)
    }
  }, [currentModal])

  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked)
  }

  const handleSave = async () => {
    if (!currentModal) return
    
    try {
      await updateModal({ responseEmailNotifications: enabled })
      setInitialEnabled(enabled)
      toast.success(`Email notifications ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error("Failed to save email notification setting:", error)
      toast.error("Failed to save notification settings")
      // Revert the toggle if saving fails
      setEnabled(initialEnabled)
    }
  }

  // Check if form has changes to enable/disable save button
  const hasChanges = () => {
    if (isLoading) return false
    return enabled !== initialEnabled
  }

  if (!currentModal) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No modal selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-2 flex items-center text-gray-900">
              <div className="w-6 h-6 bg-[#F5FF78] rounded-full flex items-center justify-center mr-3">
                <Bell className="h-4 w-4 text-[#1C1617]" />
              </div>
              Email Notifications
            </h2>
            <p className="text-sm text-slate-600">
              Manage email notifications for responses submitted through this modal.
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-[#1C1617] text-sm font-medium">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E4F222] border-t-transparent"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        <Card className="border-none shadow-none">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#F5FF78] rounded-full flex items-center justify-center mr-3">
                      <Bell className="h-3 w-3 text-[#1C1617]" />
                    </div>
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Response email notifications
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Get notified via email when someone submits a response through any agent in this modal
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={enabled}
                    onCheckedChange={handleToggleChange}
                    disabled={isSaving}
                    className="data-[state=checked]:bg-[#E4F222] scale-75"
                    aria-label="Toggle email notifications"
                  />
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !hasChanges()}
                    variant="outline"
                    size="sm"
                    className={`h-8 text-xs px-4 transition-all duration-300 ease-in-out ${hasChanges() ? 'bg-black text-white hover:bg-gray-800' : ''}`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 