"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Bell, Loader2 } from "lucide-react"
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
  const [initialEnabled, setInitialEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load the current setting when the component mounts
  useEffect(() => {
    const loadSetting = async () => {
      try {
        setIsLoading(true);
        const currentSetting = await getEmailNotificationSetting(chatId);
        setEnabled(currentSetting);
        setInitialEnabled(currentSetting);
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

  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked);
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveEmailNotification(chatId, enabled);
      setInitialEnabled(enabled);
      toast.success(`Email notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Failed to save email notification setting:", error);
      toast.error("Failed to save notification settings");
      // Revert the toggle if saving fails
      setEnabled(initialEnabled);
    } finally {
      setIsSaving(false);
    }
  }

  // Check if form has changes to enable/disable save button
  const hasChanges = () => {
    if (isLoading) return false;
    return enabled !== initialEnabled;
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Bell className="h-4 w-4 mr-2 text-blue-600" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Receive email notifications when new responses are submitted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm font-medium">
                Enable email notifications
              </Label>
              <Switch
                id="email-notifications"
                checked={enabled}
                onCheckedChange={handleToggleChange}
                disabled={isSaving}
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
  )
}

