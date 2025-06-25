"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft } from "lucide-react"

export default function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  const email = searchParams?.get('email') || ''

  useEffect(() => {
    if (!email) {
      router.push('/sign-up')
    }
  }, [email, router])

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId })
        // Redirect to auto-onboarding
        router.push('/onboarding/auto')
      } else {
        // Handle incomplete verification
        setError('Verification failed. Please check your code and try again.')
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.errors?.[0]?.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!isLoaded) return
    
    setIsResending(true)
    setError('')

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      // Show success message briefly
      setError('')
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.errors?.[0]?.message || 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#E4F222] rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-600">
            We sent a verification code to<br />
            <span className="font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerifyEmail} className="space-y-6">
          <div>
            <Label htmlFor="code" className="text-sm font-medium text-gray-700">
              Verification code
            </Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="mt-1 h-12 text-center text-lg font-mono"
              maxLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full h-12 bg-[#E4F222] text-black hover:bg-[#F5FF78] font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify email'
            )}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <button
            onClick={handleResendCode}
            disabled={isResending}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>

          <button
            onClick={() => router.push('/sign-up')}
            className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 mx-auto"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to signup
          </button>
        </div>
      </div>
    </div>
  )
} 