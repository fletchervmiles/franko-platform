'use client'

import RootLayout from "@/components/custom-ui/nav"
import ContactCard from "@/components/custom-ui/contact-card"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SupportPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  if (!isLoaded || !user) {
    return null // or loading state
  }

  return (
    <RootLayout>
      <div className="w-full">
        <ContactCard />
      </div>
    </RootLayout>
  )
}
