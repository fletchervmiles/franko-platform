'use client'

import { useEffect, useState } from 'react'
import RootLayout from "@/components/custom-ui/nav"
import URLSubmissionForm from "@/components/custom-ui/url-submit"
import VoiceSelectionCard from "@/components/custom-ui/voice-selector"
import ShareableLinkChurn from "@/components/custom-ui/shareable-link-churn"
import { SelectProfile } from "@/db/schema/profiles-schema"
import { useUser } from "@clerk/nextjs"

export default function SetupPage() {
    const { user } = useUser()
    const [profile, setProfile] = useState<SelectProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return

            try {
                const response = await fetch(`/api/clients/${user.id}`)
                if (!response.ok) throw new Error('Failed to fetch profile')
                const data = await response.json()
                setProfile(data)
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [user?.id])

    return (
      <RootLayout>
        <div className="space-y-4">
          <URLSubmissionForm />
          {profile && <ShareableLinkChurn profile={profile} />}
          <VoiceSelectionCard />
        </div>
      </RootLayout>
    )
}
