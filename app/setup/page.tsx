/**
 * File Name: setup/page.tsx
 * Description: Client-side setup page component for user profile configuration
 * Purpose: Handles profile setup, URL submission, voice selection, and shareable link generation
 * Usage: Main setup page in the application, accessed after user authentication
 */

'use client'

import { useEffect, useState } from 'react'
import { SelectProfile } from "@/db/schema/profiles-schema"
import { useUser } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'

/**
 * SetupPage Component
 * Main component for handling user profile setup and configuration
 */
export default function SetupPage() {
    // Initialize hooks for user authentication and state management
    const { user, isLoaded } = useUser()
    const [profile, setProfile] = useState<SelectProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    /**
     * Authentication Check Effect
     * Redirects unauthenticated users to sign-in page
     */
    useEffect(() => {
        // Redirect to sign-in if user is not authenticated
        if (isLoaded && !user) {
            router.push('/sign-in')
        }
    }, [isLoaded, user, router])

    /**
     * Fetches user profile data from the API
     * Updates profile state with the retrieved data
     */
    const fetchProfile = async () => {
        // Skip if user ID is not available
        if (!user?.id) return

        try {   
            // Fetch profile data from the API
            const response = await fetch(`/api/clients/${user.id}`)
            
            // Handle unsuccessful API responses
            if (!response.ok) {
                const errorText = await response.text()
                console.error('Response not ok:', response.status, errorText)
                throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`)
            }
            
            // Update profile state with fetched data
            const data = await response.json()
            setProfile(data)
        } catch (error) {
            // Log errors and reset profile state
            console.error('Detailed error:', error)
            setProfile(null)
        } finally {
            // Update loading state
            setIsLoading(false)
        }
    }

    /**
     * Profile Fetch Effect
     * Triggers profile fetch when user ID changes
     */
    useEffect(() => {
        fetchProfile()
    }, [user?.id])

    /**
     * Refreshes profile data and updates UI
     * Used as callback for profile updates
     */
    const refreshProfile = async () => {
        // Set loading state
        setIsLoading(true);
        try {
            // Fetch updated profile data
            await fetchProfile();
            // Refresh the page content
            router.refresh();
        } catch (error) {
            // Handle and log any errors
            console.error('Error refreshing profile:', error);
        } finally {
            // Reset loading state
            setIsLoading(false);
        }
    };

    // Return null if user data is not yet loaded
    if (!isLoaded || !user) {
        return null; // or loading state
    }

    /**
     * Render setup page components
     * Includes URL submission, shareable link generation, and voice selection
     */

}
