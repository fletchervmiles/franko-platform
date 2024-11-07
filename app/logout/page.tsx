"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Add a small delay before redirecting to home
    const timer = setTimeout(() => {
      router.push("/")
    }, 5000)  // Show the goodbye message for 2 seconds

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-black">Thanks for stopping by, see you next time :)</p>
      </div>    
    </div>
  )
} 