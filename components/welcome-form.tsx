"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Gift } from "lucide-react"

interface WelcomeFormProps {
  onSubmit: (data: {
    firstName: string
    email: string
  }) => void
  isLoading?: boolean
  incentive_status?: boolean
  incentive_description?: string
}

export function WelcomeForm({ 
  onSubmit, 
  isLoading = false,
  incentive_status = false,
  incentive_description = ""
}: WelcomeFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
  })

  // Debug log to check if incentive props are received
  useEffect(() => {
    console.log("WelcomeForm received incentive props:", {
      status: incentive_status,
      description: incentive_description
    });
  }, [incentive_status, incentive_description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Custom input styles to prevent auto-zoom
  const inputStyles = {
    fontSize: '16px', // Minimum 16px to prevent zoom on iOS
    padding: '12px 16px', // Larger tap target
    lineHeight: '1.5', // Improved readability
    touchAction: 'manipulation' // Better touch handling
  };

  // Button styles to ensure consistency
  const buttonStyles = {
    fontSize: '16px',
    minHeight: '48px',
    touchAction: 'manipulation'
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Debug display to check if the condition is working */}
      {incentive_status && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-700">
                {incentive_description || "Complete this conversation to receive an incentive!"}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="w-full bg-[#FAFAFA] border border-gray-200 focus:border-blue-500 focus:ring-0 h-12"
            style={inputStyles}
            autoComplete="name"
          />
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full bg-[#FAFAFA] border border-gray-200 focus:border-blue-500 focus:ring-0 h-12"
            style={inputStyles}
            autoComplete="email"
          />
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white",
            "transition-all duration-200 shadow-sm py-3 text-base font-medium",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
          style={buttonStyles}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚪</span>
              Getting Started...
            </span>
          ) : (
            "Get Started"
          )}
        </Button>
      </form>
    </div>
  )
} 