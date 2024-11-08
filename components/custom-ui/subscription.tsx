'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createStripePortalSession } from "@/actions/stripe-actions"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

interface AccountSectionProps {
  stripeCustomerId?: string | null
}

export default function AccountSection({ stripeCustomerId }: AccountSectionProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
    <Card className="w-full bg-gray-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          className="bg-[#0000FF] text-white hover:bg-[#0000FF]/90 transition-colors"
          onClick={handleManageSubscription}
          disabled={isPending || !stripeCustomerId}
        >
          {isPending ? "Loading..." : "Manage Subscription"}
        </Button>
        {!stripeCustomerId && (
          <p className="text-sm text-gray-500 mt-2">
            No subscription found. Visit the pricing page to subscribe.
          </p>
        )}
      </CardContent>
    </Card>
  )
}