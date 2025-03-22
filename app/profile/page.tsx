'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, User } from 'lucide-react'
import { NavSidebar } from "../../components/nav-sidebar"
import { createStripePortalSession } from "@/actions/stripe-actions"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { openUserProfile } = useClerk()
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  
  // In a real implementation, you'd fetch the user's profile data here
  // For demo purposes, we're just setting state directly
  useEffect(() => {
    // Fetch user profile data or get from props
    // This is where you'd get the stripeCustomerId
    // For testing, you could set a dummy value:
    // setStripeCustomerId("cus_example")
  }, [])

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      console.error("No Stripe customer ID found")
      return
    }

    startTransition(async () => {
      try {
        const url = await createStripePortalSession(stripeCustomerId)
        router.push(url)
      } catch (error) {
        console.error("Failed to create portal session:", error)
      }
    })
  }

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
        <div className="flex flex-col items-start">
          <h1 className="text-xl font-semibold tracking-tight">Your Account</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and profile settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="w-full">
            <CardHeader className="px-6 py-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-base font-medium">
                  Manage Subscription
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-2">
              <p className="text-sm text-muted-foreground">
                Update your subscription plan, payment method or billing information.
              </p>
            </CardContent>

            <CardFooter className="px-6 py-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isPending || !stripeCustomerId}
              >
                {isPending ? "Loading..." : "Manage"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-full">
            <CardHeader className="px-6 py-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-base font-medium">
                  Manage User Profile
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-2">
              <p className="text-sm text-muted-foreground">
                Update your personal information, email preferences and account settings.
              </p>
            </CardContent>

            <CardFooter className="px-6 py-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => openUserProfile()}
              >
                Manage
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </NavSidebar>
  )
}
