import RootLayout from "@/components/custom-ui/nav"
import AccountSection from "@/components/custom-ui/subscription"
import UsageOverview from "@/components/custom-ui/plan-usage"
import { auth } from "@clerk/nextjs/server"
import { getProfile } from "@/db/queries/profiles-queries"

export default async function AccountPage() {
    const { userId } = await auth()
    const profile = userId ? await getProfile(userId) : null
    
    const usageMetrics = {
      totalLifetimeMinutes: 0,
      minutesUsedThisMonth: 0,
      remainingMinutes: 0,
      monthlyQuota: 0
    }
    
    return (
      <RootLayout>
        <div className="space-y-4">
          <UsageOverview metrics={usageMetrics} />
          <AccountSection stripeCustomerId={profile?.stripeCustomerId} />
        </div>
      </RootLayout>
    )
}

