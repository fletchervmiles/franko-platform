"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Gift, User, Mail, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface WelcomeFormProps {
  onSubmit: (data: {
    firstName: string
    email: string
  }) => void
  isLoading?: boolean
  incentive_status?: boolean
  incentive_description?: string
  buttonColor?: string
  useGradientButton?: boolean
}

// Define the Zod schema for the form
const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
})

export function WelcomeForm({ 
  onSubmit, 
  isLoading = false,
  incentive_status = false,
  incentive_description = "",
  buttonColor,
  useGradientButton
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

  // Initialize the form using react-hook-form and Zod resolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      email: "",
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Basic validation before submitting
    if (!formData.firstName.trim() || !formData.email.trim()) {
      // Optionally show a toast or inline error
      console.error("Form fields cannot be empty");
      // You might want to trigger react-hook-form validation manually here if using it
      // form.trigger();
      return;
    }
     // Simple email format check (consider a more robust library if needed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.error("Invalid email format");
      // form.setError("email", { type: "manual", message: "Invalid email format" });
      return;
    }
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
              className="pl-12 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-0 h-12 placeholder:text-sm"
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
              className="pl-12 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-0 h-12 placeholder:text-sm"
              style={inputStyles}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full text-white py-6",
            useGradientButton && "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          )}
          style={{ backgroundColor: !useGradientButton ? buttonColor : undefined }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Your Session...
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