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
                console.log('Fetching profile for user:', user.id)
                const response = await fetch(`/api/clients/${user.id}`)
                
                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('Response not ok:', response.status, errorText)
                    throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`)
                }
                
                const data = await response.json()
                console.log('Profile data received:', data)
                setProfile(data)
            } catch (error) {
                console.error('Detailed error:', error)
                setProfile(null)
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
