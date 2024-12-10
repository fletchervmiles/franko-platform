'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createStripePortalSession } from "@/actions/stripe-actions"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"

interface AccountSectionProps {
  stripeCustomerId?: string | null
  userId: string
}

export default function AccountSection({ 
  stripeCustomerId, 
  userId
}: AccountSectionProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { openUserProfile } = useClerk()

  console.log('Subscription component:', {
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
    <Card className="w-full bg-white p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-semibold">Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              className="bg-[#0000FF] text-white hover:bg-[#0000FF]/90 transition-colors h-8 text-xs px-3"
              onClick={handleManageSubscription}
              disabled={isPending || !stripeCustomerId}
            >
              {isPending ? "Loading..." : "Manage Subscription"}
            </Button>
            <Button 
              className="bg-[#475569] text-white hover:bg-[#475569]/90 transition-colors h-8 text-xs px-3"
              onClick={() => openUserProfile()}
            >
              Manage Account
            </Button>
          </div>
          {!stripeCustomerId && (
            <p className="text-sm text-muted-foreground">
              No subscription found. Visit the pricing page to subscribe.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}