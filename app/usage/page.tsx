import { UsageCard } from "../../components/usage-card"
import { NavSidebar } from "../../components/nav-sidebar"
import { auth } from "@clerk/nextjs/server"
import { getProfileByUserId } from "@/db/queries/profiles-queries"
import { formatProfileToUiUsageData } from "@/lib/utils/usage-formatter"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  // Get the current user ID from auth
  const { userId } = await auth()
  
  // Redirect if not authenticated
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Fetch user profile from database
  const profile = await getProfileByUserId(userId)
  
  // Handle case where profile doesn't exist
  if (!profile) {
    // Could redirect to a profile creation page or show an error message
    return (
      <div className="w-full p-4 md:p-8 lg:p-12">
        <h1 className="text-xl font-semibold">Profile not found</h1>
        <p>Please contact support if this issue persists.</p>
      </div>
    )
  }
  
  // Format the profile data for UI display
  const usageData = formatProfileToUiUsageData(profile)

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
        <div className="flex flex-col items-start">
          <h1 className="text-xl font-semibold tracking-tight">Usage Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your platform usage and limits
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <UsageCard
            title="Responses"
            used={usageData.responses.used}
            total={usageData.responses.total}
            percentage={usageData.responses.percentage}
            infoTooltip="A response is counted when a respondent meaningfully engages with the AI. Immediate abandonment won't count, but partially completed responses will."
          />
          <UsageCard
            title="Chat Messages"
            used={usageData.qaMessages.used}
            total={usageData.qaMessages.total}
            percentage={usageData.qaMessages.percentage}
          />
        </div>
      </div>
    </NavSidebar>
  )
}

