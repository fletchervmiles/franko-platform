"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-[#E4F222] rounded-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-black animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Completing your signup...
        </h1>
        <p className="text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
      
      <AuthenticateWithRedirectCallback 
        redirectUrl="/onboarding/auto"
      />
    </div>
  )
} 