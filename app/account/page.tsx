import RootLayout from "@/components/custom-ui/nav"
import URLSubmissionForm from "@/components/custom-ui/url-submit"
import AccountSection from "@/components/custom-ui/subscription"
import VoiceSelectionCard from "@/components/custom-ui/voice-selector"
import { auth } from "@clerk/nextjs/server"
import { getProfile } from "@/db/queries/profiles-queries"

export default async function AccountPage() {
    const { userId } = await auth()
    const profile = userId ? await getProfile(userId) : null
    
    // Debug log
    console.log('Profile data:', {
      userId,
      hasProfile: !!profile,
      stripeCustomerId: profile?.stripeCustomerId
    })
  
    return (
      <RootLayout>
        <div className="space-y-4">
          <URLSubmissionForm />
          <VoiceSelectionCard />
          <AccountSection stripeCustomerId={profile?.stripeCustomerId} />
        </div>
      </RootLayout>
    )
}

