"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface WelcomeFormProps {
  onSubmit: (data: {
    firstName: string
    email: string
  }) => void
  isLoading?: boolean
}

export function WelcomeForm({ onSubmit, isLoading = false }: WelcomeFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="w-full bg-[#FAFAFA] border border-gray-200 focus:border-blue-500 focus:ring-0"
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
            className="w-full bg-[#FAFAFA] border border-gray-200 focus:border-blue-500 focus:ring-0"
          />
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white",
            "transition-all duration-200 shadow-sm py-2.5 text-base font-medium",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
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

      <div className="text-center text-sm text-gray-400">
        powered by Franko.ai
      </div>
    </div>
  )
} 