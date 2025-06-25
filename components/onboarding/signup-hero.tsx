"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { Loader2, Chrome } from "lucide-react"

const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'aol.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'yandex.com', 'zoho.com', 'live.com', 'msn.com'
]

export default function SignupHero() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  
  // Form state
  const [step, setStep] = useState<'email' | 'details'>('email')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const validateBusinessEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false
    return !BLOCKED_DOMAINS.includes(domain)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!validateBusinessEmail(email)) {
      setError('Please use your work email address. Personal email providers (Gmail, Yahoo, etc.) are not allowed.')
      return
    }

    setStep('details')
  }

  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      console.log('Starting signup process...')
      
      // Create the user with Clerk
      const result = await signUp.create({
        emailAddress: email,
        firstName,
        lastName,
        password,
      })

      console.log('User created successfully:', result)

      // Check if email verification is required
      if (result.status === 'missing_requirements') {
        console.log('Email verification required, preparing...')
        
        try {
          // Send email verification
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
          console.log('Email verification prepared successfully')
          
          // Redirect to verification with email in query
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        } catch (verificationError) {
          console.error('Email verification preparation failed:', verificationError)
          // If verification fails, still redirect but show the error
          setError('Account created but email verification failed. Please try signing in.')
          // Optionally redirect to sign-in instead
          // router.push(`/sign-in`)
        }
      } else if (result.status === 'complete') {
        console.log('Signup complete, setting active session...')
        // If no verification needed, set active and redirect
        await setActive({ session: result.createdSessionId })
        router.push('/onboarding/auto')
      } else {
        console.log('Unexpected signup status:', result.status)
        setError('Signup completed with unexpected status. Please try signing in.')
      }

    } catch (err: any) {
      console.error('Signup error:', err)
      console.error('Error details:', {
        message: err.message,
        errors: err.errors,
        status: err.status,
        code: err.code
      })
      
      // Better error handling
      if (err.errors && err.errors.length > 0) {
        const firstError = err.errors[0]
        if (firstError.code === 'form_identifier_exists') {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(firstError.message || 'An error occurred during signup')
        }
      } else {
        setError(err.message || 'An error occurred during signup')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!isLoaded) return
    
    setIsGoogleLoading(true)
    setError('')

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding/auto"
      })
    } catch (err: any) {
      console.error('Google signup error:', err)
      setError(err.errors?.[0]?.message || 'An error occurred with Google signup')
      setIsGoogleLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setFirstName('')
    setLastName('')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4 sm:p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="flex flex-col justify-center py-8 lg:py-12">
            <div className="mb-8">
              <Image src="/placeholder.svg?width=90&height=30" alt="Company Logo Placeholder" width={90} height={30} />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Get started for free.
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Cards, expenses, bills, and accounting – beautifully reimagined by experts to save you time and money.
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email Step */}
            {step === 'email' && (
              <div className="w-full max-w-lg space-y-6">
                <form onSubmit={handleEmailSubmit} className="relative w-full">
                  <Input
                    type="email"
                    placeholder="what's your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#2121210F] border-gray-300 focus:ring-2 focus:ring-[#E4F222]/80 focus:border-[#E4F222] text-gray-900 placeholder-gray-500 h-14 pl-4 pr-[180px] rounded-lg w-full text-base"
                    required
                  />
                  <Button
                    type="submit"
                    className="absolute right-[7px] top-1/2 -translate-y-1/2 bg-[#E4F222] text-black hover:bg-[#F5FF78] active:bg-[#F5FF78] font-semibold px-4 rounded-md h-[44px] text-sm"
                    style={{ width: "165px" }}
                  >
                    Get started for free
                  </Button>
                </form>

                <div className="flex items-center">
                  <Separator className="flex-1" />
                  <span className="px-3 text-sm text-gray-500">or</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  onClick={handleGoogleSignup}
                  disabled={isGoogleLoading}
                  variant="outline"
                  className="w-full h-12 border-gray-300 hover:bg-gray-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>
              </div>
            )}

            {/* Details Step */}
            {step === 'details' && (
              <div className="w-full max-w-lg space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Complete your account</h2>
                  <p className="text-gray-600 text-sm">
                    Using: <span className="font-medium">{email}</span>
                    <button 
                      onClick={handleBackToEmail}
                      className="ml-2 text-[#E4F222] hover:underline text-sm"
                    >
                      Change email
                    </button>
                  </p>
                </div>

                <form onSubmit={handleManualSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 h-12"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 h-12"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#E4F222] text-black hover:bg-[#F5FF78] active:bg-[#F5FF78] font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
              </div>
            )}

            <p className="mt-6 text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#E4F222] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Right Column */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden w-full max-w-sm">
              <Image
                src="/placeholder.svg?width=400&height=320"
                alt="Testimonial Portrait Placeholder"
                width={400}
                height={320}
                className="w-full h-auto object-cover"
              />
              <div className="p-6 text-white">
                <div className="mb-3">
                  <Image
                    src="/placeholder.svg?width=90&height=20"
                    alt="Webflow Logo Placeholder"
                    width={90}
                    height={20}
                  />
                </div>
                <blockquote className="text-base sm:text-lg mb-4 leading-relaxed">
                  &ldquo;This is a placeholder quote. Growing companies need scalable products. This platform helps us
                  evolve.&rdquo;
                </blockquote>
                <div className="text-gray-400 text-sm">
                  <p className="font-semibold">Placeholder Name</p>
                  <p>VP of Placeholder, Placeholder Inc.</p>
                </div>
                <div className="flex justify-center space-x-1.5 mt-6">
                  <span className="block w-2 h-2 bg-white rounded-full"></span>
                  <span className="block w-2 h-2 bg-gray-600 rounded-full"></span>
                  <span className="block w-2 h-2 bg-gray-600 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
