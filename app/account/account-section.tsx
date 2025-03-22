'use client'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, User } from 'lucide-react'
import { createStripePortalSession } from "@/actions/stripe-actions"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"

interface AccountSectionProps {
  stripeCustomerId?: string | null
}

export default function AccountSection({ stripeCustomerId }: AccountSectionProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { openUserProfile } = useClerk()

  console.log('Account section component:', {
    hasStripeId: !!stripeCustomerId,
    stripeId: stripeCustomerId
  })

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
  )
} 