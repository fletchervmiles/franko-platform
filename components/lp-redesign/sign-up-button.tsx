import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useSignUp } from "@clerk/nextjs"
import { useState } from "react"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props} fill="none">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.317-11.297-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.986,36.046,44,30.606,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  )
}

export function SignupForm() {
  const router = useRouter()
  const { isLoaded, signUp } = useSignUp()
  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/sign-up')
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
      setError(err.errors?.[0]?.message || 'Google signup error')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex w-full sm:w-fit flex-col gap-1 sm:flex-row items-stretch rounded-lg bg-white p-2 shadow-md">
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      <Button
        type="submit"
        onClick={handleSubmit}
        className="shrink-0 rounded-md px-4 py-1.5 text-sm font-medium transition-colors w-28"
        style={{ 
          backgroundColor: '#E4F222',
          color: '#0C0A08'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5FF78' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E4F222' }}
      >
        Get Started
      </Button>
      <div className="hidden self-stretch w-px bg-gray-200 sm:block" />
      <Button 
        variant="outline" 
        className="shrink-0 rounded-md bg-transparent px-3 py-2 text-sm hover:bg-gray-100 w-28 flex items-center justify-center gap-1 text-[#0C0A08]"
        onClick={handleGoogleSignup}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? 'Loading...' : (
          <>
            <GoogleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sign&nbsp;up</span>
            <span className="sm:hidden">Sign</span>
          </>
        )}
      </Button>
    </div>
  )
}