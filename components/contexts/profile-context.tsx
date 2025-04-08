'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { getProfileByUserId } from '@/db/queries/profiles-queries';

interface Profile {
  id: string;
  userId: string;
  organisationUrl: string | null;
  organisationName: string | null;
  organisationDescription: string | null;
  organisationDescriptionCompleted: boolean;
  // Add other profile fields if needed
}

interface ProfileContextType {
  profile: Profile | null | undefined;
  isLoading: boolean;
  hasContext: boolean; // Derived: URL and Name exist
  contextCompleted: boolean; // Derived: Description exists and is marked complete
  highlightWorkspaceNavItem: boolean; // New state for nav highlight
  setHighlightWorkspaceNavItem: (highlight: boolean) => void; // Setter for highlight
  refetchProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

// Function to fetch the profile data (used by useQuery)
const fetchProfileQueryFn = async (userId: string | undefined): Promise<Profile | null> => {
  if (!userId) return null;
  const profileData = await getProfileByUserId(userId);
  // Ensure the returned structure matches the Profile interface
  // You might need type casting or validation here depending on what getProfileByUserId returns
  return profileData as Profile | null; 
};

// Provider component using useQuery (this is the one we keep and modify)
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [highlightWorkspaceNavItem, setHighlightWorkspaceNavItem] = useState(false);
  
  // Query for the profile data using React Query
  const { 
    data: profile, 
    isLoading: isProfileLoading,
    refetch
  } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfileQueryFn(user?.id),
    enabled: !!user?.id && isLoaded,
    staleTime: 60000,
  });

  // Determine derived states based on the fetched profile data
  const hasContext = !!(profile?.organisationUrl && profile?.organisationName);
  const contextCompleted = !!profile?.organisationDescriptionCompleted;
  const isLoading = !isLoaded || (isLoaded && !!user && isProfileLoading);

  // The value to be provided to consumers, including the new state and setter
  const value: ProfileContextType = {
    profile,
    isLoading,
    hasContext,
    contextCompleted,
    highlightWorkspaceNavItem,
    setHighlightWorkspaceNavItem,
    refetchProfile: refetch,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
} 