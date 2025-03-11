"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Loader2, Check } from "lucide-react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

// Real implementation to save email notification setting
const saveEmailNotification = async (chatId: string, enabled: boolean): Promise<void> => {
  try {
    const response = await fetch(`/api/chat-instances/${chatId}/notifications`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response_email_notifications: enabled }),
    });

    if (!response.ok) {
      throw new Error('Failed to save notification settings');
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving email notification setting:", error);
    throw error;
  }
}

// Function to get the current notification setting
const getEmailNotificationSetting = async (chatId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/chat-instances/${chatId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch chat instance');
    }
    const data = await response.json();
    return data.response_email_notifications || false;
  } catch (error) {
    console.error("Error fetching email notification setting:", error);
    return false; // Default to false if there's an error
  }
}

export function EmailNotificationSetting() {
  const params = useParams();
  const chatId = Array.isArray(params.guideName) ? params.guideName[0] : params.guideName;
  
  const [enabled, setEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load the current setting when the component mounts
  useEffect(() => {
    const loadSetting = async () => {
      try {
        setIsLoading(true);
        const currentSetting = await getEmailNotificationSetting(chatId);
        setEnabled(currentSetting);
      } catch (error) {
        console.error("Failed to load notification setting:", error);
        toast.error("Failed to load notification settings");
      } finally {
        setIsLoading(false);
      }
    };

    if (chatId) {
      loadSetting();
    }
  }, [chatId]);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setIsSaving(true);
    try {
      await saveEmailNotification(chatId, checked);
      setIsSaved(true);
      toast.success(`Email notifications ${checked ? 'enabled' : 'disabled'}`);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save email notification setting:", error);
      toast.error("Failed to save notification settings");
      // Revert the toggle if saving fails
      setEnabled(!checked);
    } finally {
      setIsSaving(false);
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
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Switch
            id="email-notifications"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isSaving}
            aria-label="Toggle email notifications"
            className="data-[state=checked]:bg-green-500"
          />
        )}
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

