"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Gift, Loader2, Check } from "lucide-react"

const mockSaveIncentive = async (enabled: boolean, incentive: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Incentive setting saved:", { enabled, incentive })
      resolve()
    }, 1000)
  })
}

export function IncentiveSetting() {
  const [enabled, setEnabled] = useState(false)
  const [incentive, setIncentive] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [savedIncentive, setSavedIncentive] = useState("")

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await mockSaveIncentive(enabled, incentive)
      setSavedIncentive(incentive)
      setIsEditMode(false)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      console.error("Failed to save incentive setting:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="w-4 h-4 text-blue-600" />
          Incentive
        </h3>
        <p className="text-sm text-gray-500">
          Offer an incentive (e.g., discount code or coupon) to respondents upon completion of the conversation.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable-incentive">Enable incentive</Label>
          </div>
          <Switch
            id="enable-incentive"
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked)
              if (!checked) {
                setIsEditMode(false)
                setIncentive("")
                setSavedIncentive("")
              }
            }}
            aria-label="Toggle incentive"
            className="data-[state=checked]:bg-green-500"
          />
        </div>
        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="incentive-input">Incentive (e.g., discount code or coupon)</Label>
            <Input
              id="incentive-input"
              value={isEditMode ? incentive : savedIncentive}
              onChange={(e) => setIncentive(e.target.value)}
              placeholder="Enter incentive details"
              disabled={!isEditMode}
            />
          </div>
        )}
        {enabled && (
          <Button
            onClick={isEditMode ? handleSave : handleEdit}
            disabled={isSaving || (isEditMode && !incentive)}
            variant="outline"
            size="sm"
            className="h-8 text-xs px-4 transition-all duration-300 ease-in-out"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-2 h-3 w-3" />
                Saved
              </>
            ) : isEditMode ? (
              "Save"
            ) : (
              "Edit"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

