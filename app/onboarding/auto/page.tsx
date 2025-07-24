"use client"

import React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import ProcessingSteps from "@/components/onboarding/processing-steps"
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export default function AutoOnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("Starting setup...")
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent multiple initialization calls
  const initializationAttempted = useRef(false)
  const isInitializing_ref = useRef(false)

  // Initialize auto-onboarding
  useEffect(() => {
    async function initializeOnboarding() {
      // Wait for Clerk to fully load and ensure user is authenticated
      if (!isLoaded || !user || !user.primaryEmailAddress?.emailAddress) {
        console.log('Waiting for authentication to complete...', { isLoaded, hasUser: !!user, hasEmail: !!user?.primaryEmailAddress?.emailAddress })
        return
      }
      
      // Prevent multiple simultaneous calls
      if (initializationAttempted.current || isInitializing_ref.current) {
        console.log('Initialization already attempted or in progress, skipping')
        return
      }
      
      initializationAttempted.current = true
      isInitializing_ref.current = true

      try {
        console.log('Starting auto-onboarding API call for user:', user.id)
        const response = await fetch('/api/onboarding/auto-start', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: user.primaryEmailAddress.emailAddress 
          }),
        })

        const result = await response.json()
        console.log('Auto-start API response:', { status: response.status, result })

        if (!response.ok || result.shouldFallback) {
          console.log('Auto-start failed or fallback required:', { status: response.status, result })
          if (result.fallbackUrl) {
            router.push(result.fallbackUrl)
          } else {
            router.push('/context-setup')
          }
          return
        }

        if (result.skipped) {
          console.log('Auto-start skipped:', result.reason)
          if (user?.id) {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
          }
          router.push(result.redirectTo || '/workspace')
          return
        }

        // Handle case where automation was already started
        if (result.alreadyStarted) {
          console.log('Automation already in progress, continuing to poll')
        }

        console.log('Auto-start successful, beginning progress polling')
        setIsInitializing(false)

      } catch (error) {
        console.error('Error initializing auto-onboarding:', error)
        setError('Failed to start setup')
        setTimeout(() => router.push('/context-setup'), 2000)
      } finally {
        isInitializing_ref.current = false
      }
    }

    // Debounce the initialization call
    const timeoutId = setTimeout(initializeOnboarding, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [isLoaded, user, router])

  // Poll for progress
  useEffect(() => {
    if (isInitializing) return

         let pollInterval: NodeJS.Timeout | null = null

    const pollProgress = async () => {
      try {
        const response = await fetch('/api/onboarding/progress')
        if (!response.ok) throw new Error('Progress check failed')
        
        const data = await response.json()
        setProgress(data.progress)
        setMessage(data.message)
        
                 if (data.isComplete && data.shouldRedirect) {
           if (pollInterval) clearInterval(pollInterval)
           setTimeout(() => {
             if (user?.id) {
               queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
             }
             router.push(data.shouldRedirect)
           }, 1500)
         }
         
       } catch (err) {
         console.error('Error polling progress:', err)
         setError('Setup encountered an issue')
         if (pollInterval) clearInterval(pollInterval)
       }
    }

    pollProgress() // Initial poll
    pollInterval = setInterval(pollProgress, 2000) // Poll every 2 seconds

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [isInitializing, router])

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
        <ProcessingSteps />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Setup Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to manual setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
      <ProcessingSteps 
        progress={progress}
        currentStep={message}
      />
    </div>
  )
} 