"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gift, User, Mail, ArrowRight } from "lucide-react"

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
    lineHeight: '1.5', // Improved readability
    touchAction: 'manipulation' // Better touch handling
  };

  return (
    <div className="space-y-6 w-full">
      {/* Incentive banner */}
      {incentive_status && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-500" />
            <p className="text-sm text-gray-700">
              {incentive_description || "Complete this conversation to receive an incentive!"}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm text-gray-700">
            First Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <User size={18} />
            </div>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              placeholder="Enter your first name"
              className="pl-12 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-0 h-12"
              style={inputStyles}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
              <Mail size={18} />
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter your email address"
              className="pl-12 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-0 h-12"
              style={inputStyles}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚪</span>
              Getting Started...
            </span>
          ) : (
            <>
              Start Chatting
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
} 