"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { Loader2, Gift } from "lucide-react"

export function IncentiveSetting() {
  const params = useParams()
  const chatId = params?.guideName as string

  // State for form values
  const [incentiveStatus, setIncentiveStatus] = useState<boolean>(false)
  const [initialStatus, setInitialStatus] = useState<boolean>(false)
  const [incentiveCode, setIncentiveCode] = useState("")
  const [initialCode, setInitialCode] = useState("")
  const [incentiveDescription, setIncentiveDescription] = useState("")
  const [initialDescription, setInitialDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch current incentive settings
  useEffect(() => {
    async function fetchIncentiveSettings() {
      if (!chatId) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/chat-instances/details?chatId=${chatId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch incentive settings")
        }

        const data = await response.json()
        
        // Store initial values for comparison
        const status = data.incentiveStatus || false;
        setIncentiveStatus(status)
        setInitialStatus(status)
        
        const code = data.incentiveCode || "";
        setIncentiveCode(code)
        setInitialCode(code)
        
        // Remove the prefix from incentive description if it exists
        let incentiveDesc = data.incentiveDescription || ""
        const prefix = "Upon completion, you'll receive "
        if (incentiveDesc.startsWith(prefix)) {
          incentiveDesc = incentiveDesc.substring(prefix.length)
        }
        
        setIncentiveDescription(incentiveDesc)
        setInitialDescription(incentiveDesc)
      } catch (error) {
        console.error("Error fetching incentive settings:", error)
        toast.error("Failed to load incentive settings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncentiveSettings()
  }, [chatId])

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setIncentiveStatus(checked);
  }

  // Handle form submission
  const handleSave = async () => {
    // Validate inputs if incentive is enabled
    if (incentiveStatus && (!incentiveCode || !incentiveDescription)) {
      toast.error("Please provide both incentive code and description")
      return
    }

    setIsSaving(true)
    
    try {
      // Format incentive description with prefix
      const formattedIncentiveDescription = incentiveStatus 
        ? `Upon completion, you'll receive ${incentiveDescription}` 
        : ""

      const response = await fetch(`/api/chat-instances/${chatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incentiveStatus,
          incentiveCode: incentiveStatus ? incentiveCode : "",
          incentiveDescription: formattedIncentiveDescription,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update incentive settings")
      }

      // Update initial values after successful save
      setInitialStatus(incentiveStatus);
      setInitialCode(incentiveCode);
      setInitialDescription(incentiveDescription);
      
      toast.success("Incentive settings updated successfully")
    } catch (error) {
      console.error("Error updating incentive settings:", error)
      toast.error("Failed to update incentive settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Check if form has changes to enable/disable save button
  const hasChanges = () => {
    if (isLoading) return false
    
    return incentiveStatus !== initialStatus || 
           incentiveCode !== initialCode || 
           incentiveDescription !== initialDescription;
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Gift className="h-4 w-4 mr-2 text-blue-600" />
          Incentive Settings
        </CardTitle>
        <CardDescription>
          Offer incentives to encourage participation and completion
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
              <Label htmlFor="incentive-toggle" className="text-sm font-medium">
                Enable incentive
              </Label>
              <Switch 
                id="incentive-toggle"
                checked={incentiveStatus}
                onCheckedChange={handleToggleChange}
                disabled={isSaving}
                aria-label="Toggle incentive"
              />
            </div>
            
            {incentiveStatus && (
              <div className="space-y-6 mt-6 p-5 bg-gray-50 rounded-md border border-gray-100">
                <div>
                  <Label htmlFor="incentive-code" className="text-sm font-medium">
                    Incentive Code
                  </Label>
                  <Input
                    id="incentive-code"
                    value={incentiveCode}
                    onChange={(e) => setIncentiveCode(e.target.value)}
                    placeholder="Enter a discount code to share after the chat (e.g., 'SAVE10')"
                    className="bg-white mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="incentive-description" className="text-sm font-medium">
                    Incentive Details
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    Complete the sentence to describe your reward. It will appear to users prefixed with "Upon completion, you'll receive".
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm whitespace-nowrap italic text-gray-600">Upon completion, you'll receive</span>
                    <Input
                      id="incentive-description"
                      value={incentiveDescription}
                      onChange={(e) => setIncentiveDescription(e.target.value)}
                      placeholder="20% off your next order, a free sample, etc."
                      className="bg-white flex-1"
                    />
                  </div>
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

