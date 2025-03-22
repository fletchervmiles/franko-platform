import { auth } from "@clerk/nextjs/server"
import { getProfileByUserId } from "@/db/queries/profiles-queries"
import { redirect } from "next/navigation"
import { NavSidebar } from "../../components/nav-sidebar"
import AccountSection from "./account-section"

export default async function ProfilePage() {
  // Get the current user ID from auth
  const { userId } = await auth()
  
  // Redirect if not authenticated
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Fetch user profile from database
  const profile = await getProfileByUserId(userId)
  
  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
        <div className="flex flex-col items-start">
          <h1 className="text-xl font-semibold tracking-tight">Your Account</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and profile settings
          </p>
        </div>

        <AccountSection stripeCustomerId={profile?.stripeCustomerId} />
      </div>
    </NavSidebar>
  )
}
