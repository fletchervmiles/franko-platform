"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { Loader2, ExternalLink } from "lucide-react"

// More flexible URL validation (checks if it looks like a domain name)
const isValidUrlInput = (url: string): boolean => {
  if (!url) return false;
  // Basic check: contains a dot and no invalid characters (like spaces)
  // Allows domain names without protocol
  return url.includes('.') && !/\s/.test(url);
}

// Function to ensure URL has a protocol
const ensureHttpsProtocol = (url: string): string => {
  if (!url) return url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export function RedirectSetting() {
  const params = useParams()
  const idVariable = params ? (params as any).guideName : undefined

  // State for form values
  const [enabled, setEnabled] = useState<boolean>(false)
  const [initialEnabled, setInitialEnabled] = useState<boolean>(false)
  const [redirectUrl, setRedirectUrl] = useState<string>("")
  const [initialRedirectUrl, setInitialRedirectUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      if (!idVariable) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/chat-instances/${idVariable}`)
        if (!response.ok) {
          throw new Error("Failed to fetch redirect settings")
        }

        const data = await response.json()
        
        // Store initial values for comparison
        const currentUrl = data.redirect_url || null;
        const isCurrentlyEnabled = !!currentUrl;
        
        setEnabled(isCurrentlyEnabled)
        setInitialEnabled(isCurrentlyEnabled)
        
        setRedirectUrl(currentUrl || "")
        setInitialRedirectUrl(currentUrl)
        
      } catch (error) {
        console.error("Error fetching redirect settings:", error)
        toast.error("Failed to load redirect settings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [idVariable])

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked);
    // Optionally clear URL when disabled, or keep it until save
    // if (!checked) {
    //   setRedirectUrl("");
    // }
  }

  // Handle input change
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRedirectUrl(event.target.value);
  }

  // Handle form submission
  const handleSave = async () => {
    if (!idVariable) return
    
    let finalUrlToSave: string | null = null;

    // Validate and prepare URL if redirect is enabled
    if (enabled) {
      if (!redirectUrl || !isValidUrlInput(redirectUrl)) {
         toast.error("Please provide a valid domain or URL (e.g., yoursite.com or https://yoursite.com)")
         return
      }
      // Ensure the URL has https:// prefix before saving
      finalUrlToSave = ensureHttpsProtocol(redirectUrl);
    } else {
       finalUrlToSave = null; // Set to null if disabled
    }


    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/chat-instances/${idVariable}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Send the processed URL (with protocol or null)
          redirect_url: finalUrlToSave, 
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update redirect settings")
      }

      // Update initial values after successful save
      setInitialEnabled(enabled);
      // Store the potentially modified URL in initial state as well
      setInitialRedirectUrl(finalUrlToSave); 
      // Keep the user's input format in the input field if enabled
      setRedirectUrl(enabled ? redirectUrl : ""); 
      
      toast.success("Redirect settings updated successfully")
    } catch (error) {
      console.error("Error updating redirect settings:", error)
      toast.error("Failed to update redirect settings")
      // Revert state on error? Or just show error toast? Current approach: just show toast.
    } finally {
      setIsSaving(false)
    }
  }

  // Check if form has changes to enable/disable save button
  const hasChanges = () => {
    if (isLoading) return false
    
    // Compare current input value with initial potentially-prefixed value
    const comparableInitialUrl = initialRedirectUrl || ""; 
    // Prepend protocol to current input for comparison IF enabled
    const comparableCurrentUrl = enabled ? ensureHttpsProtocol(redirectUrl || "") : "";

    // More robust change detection:
    // 1. Enabled status changed?
    if (enabled !== initialEnabled) return true;
    // 2. If enabled, did the *processed* URL change?
    if (enabled && comparableCurrentUrl !== comparableInitialUrl) return true;
    // 3. If disabled, no URL change matters.

    return false; // No changes detected
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <ExternalLink className="h-4 w-4 mr-2 text-blue-600" />
          Redirect on Completion
        </CardTitle>
        <CardDescription>
          Redirect to a custom URL when the conversation is completed.
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
              <Label htmlFor="redirect-toggle" className="text-sm font-medium">
                Enable custom redirect URL
              </Label>
              <Switch 
                id="redirect-toggle"
                checked={enabled}
                onCheckedChange={handleToggleChange}
                disabled={isSaving}
                aria-label="Toggle custom redirect"
              />
            </div>
            
            {enabled && (
              <div className="space-y-4 mt-4 p-5 bg-gray-50 rounded-md border border-gray-100">
                <div>
                  <Label htmlFor="redirect-url" className="text-sm font-medium">
                    Redirect URL
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">
                    
                  </p>
                  <Input
                    id="redirect-url"
                    value={redirectUrl} // Show the potentially unprefixed URL in the input
                    onChange={handleUrlChange}
                    placeholder="yoursite.com/thank-you"
                    className="bg-white"
                    // Use text type for more flexibility, rely on our validation
                    type="text" 
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}
            
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