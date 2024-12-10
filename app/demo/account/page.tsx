import RootLayout from "@/components/custom-ui/demoNav"
import AccountSection from "@/components/custom-ui/subscription"
import UsageOverview from "@/components/custom-ui/plan-usage"
import { getProfile } from "@/db/queries/profiles-queries"

export default async function DemoAccountPage() {
    const userId = "user_demo_account"
    const profile = await getProfile(userId)
    
    return (
      <RootLayout>
        <div className="space-y-4">
          <UsageOverview userId={userId} />
          <AccountSection 
            stripeCustomerId={profile?.stripeCustomerId} 
            userId={userId}
          />
        </div>
      </RootLayout>
    )
}