"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Using Textarea for description
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { Loader2, MessageSquareText } from "lucide-react" // Added icon

export function ChatWelcomeScreenSetting() {
  const params = useParams()
  const idVariable = params ? (params as any).guideName : undefined

  // State for form values
  const [welcomeHeading, setWelcomeHeading] = useState("")
  const [initialWelcomeHeading, setInitialWelcomeHeading] = useState("")
  const [welcomeCardDescription, setWelcomeCardDescription] = useState("")
  const [initialWelcomeCardDescription, setInitialWelcomeCardDescription] = useState("")
  const [welcomeDescription, setWelcomeDescription] = useState("")
  const [initialWelcomeDescription, setInitialWelcomeDescription] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch current settings
  useEffect(() => {
    async function fetchWelcomeSettings() {
      if (!idVariable) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/chat-instances/details?chatId=${idVariable}`)
        if (!response.ok) {
          throw new Error("Failed to fetch welcome screen settings")
        }

        const data = await response.json()

        // Store initial values for comparison
        const heading = data.welcomeHeading || "";
        setWelcomeHeading(heading)
        setInitialWelcomeHeading(heading)

        const cardDesc = data.welcomeCardDescription || "";
        setWelcomeCardDescription(cardDesc)
        setInitialWelcomeCardDescription(cardDesc)

        const desc = data.welcomeDescription || "";
        setWelcomeDescription(desc)
        setInitialWelcomeDescription(desc)

      } catch (error) {
        console.error("Error fetching welcome settings:", error)
        toast.error("Failed to load welcome screen settings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWelcomeSettings()
  }, [idVariable])

  // Handle form submission
  const handleSave = async () => {
    if (!idVariable) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/chat-instances/${idVariable}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          welcomeHeading,
          welcomeCardDescription,
          welcomeDescription,
        }),
      })

      if (!response.ok) {
        let errorMsg = "Failed to update welcome screen settings";
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore if body can't be parsed */ }
        throw new Error(errorMsg)
      }

      // Update initial values after successful save
      setInitialWelcomeHeading(welcomeHeading);
      setInitialWelcomeCardDescription(welcomeCardDescription);
      setInitialWelcomeDescription(welcomeDescription);

      toast.success("Welcome screen settings updated successfully")
    } catch (error) {
      console.error("Error updating welcome settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update welcome screen settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Check if form has changes to enable/disable save button
  const hasChanges = () => {
    if (isLoading) return false

    return welcomeHeading !== initialWelcomeHeading ||
           welcomeCardDescription !== initialWelcomeCardDescription ||
           welcomeDescription !== initialWelcomeDescription;
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <MessageSquareText className="h-4 w-4 mr-2 text-blue-600" />
          Welcome Screen Details
        </CardTitle>
        <CardDescription>
          These details will appear on the welcome modal before the chat begins. They are automatically generated but can be edited to better suit your context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wrap input fields in a styled div */}
            <div className="space-y-4 mt-4 p-5 bg-gray-50 rounded-md border border-gray-100">
              {/* Welcome Heading */}
              <div>
                <Label htmlFor="welcome-heading" className="text-sm font-medium">
                  Welcome Heading
                </Label>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">
                  Appears as the primary heading or title in the opening modal. Typically around 5–6 words, e.g., "Ready to share feedback?"
                </p>
                <Input
                  id="welcome-heading"
                  value={welcomeHeading}
                  onChange={(e) => setWelcomeHeading(e.target.value)}
                  placeholder="e.g., Ready to share feedback?"
                  className="bg-white"
                  disabled={isSaving}
                />
              </div>

              {/* Chat Description */}
              <div>
                <Label htmlFor="chat-description" className="text-sm font-medium">
                  Chat Description
                </Label>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">
                  A short paragraph (about 15–20 words) explaining the chat's purpose or length.<br/>
                </p>
                <Textarea
                  id="chat-description"
                  value={welcomeCardDescription}
                  onChange={(e) => setWelcomeCardDescription(e.target.value)}
                  placeholder="Explain the chat's purpose or length..."
                  className="bg-white min-h-[80px]"
                  disabled={isSaving}
                />
              </div>

              {/* In-Chat Header */}
              <div>
                <Label htmlFor="in-chat-header" className="text-sm font-medium">
                  In‑Chat Header
                </Label>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">
                  A concise label (6–8 words) shown at the top of the chat window, i.e. during the live chat.<br/>
                </p>
                <Input
                  id="in-chat-header"
                  value={welcomeDescription}
                  onChange={(e) => setWelcomeDescription(e.target.value)}
                  placeholder="e.g., Quick Chat on Slack Usage"
                  className="bg-white"
                  disabled={isSaving}
                />
              </div>
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