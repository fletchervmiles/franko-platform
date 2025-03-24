'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { getProfileByUserId } from '@/db/queries/profiles-queries';

// Define the shape of our profile context
type ProfileContextType = {
  isLoading: boolean;
  hasContext: boolean;
  contextCompleted: boolean;
  refetchProfile: () => void;
};

// Create the context with default values
const ProfileContext = createContext<ProfileContextType>({
  isLoading: true,
  hasContext: false,
  contextCompleted: false,
  refetchProfile: () => {},
});

// Custom hook to use the profile context
export function useProfile() {
  return useContext(ProfileContext);
}

// Function to fetch the profile data
const fetchProfile = async (userId: string) => {
  if (!userId) return null;
  return await getProfileByUserId(userId);
};

// Provider component
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  
  // Query for the profile data using React Query
  const { 
    data: profile, 
    isLoading: isProfileLoading,
    refetch
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id as string),
    enabled: !!user?.id && isLoaded,
    staleTime: 60000, // Only refresh after 1 minute
  });

  // Determine if we have a context and if it's complete
  const hasContext = !!profile?.organisationDescription;
  const contextCompleted = !!profile?.organisationDescriptionCompleted;
  const isLoading = isProfileLoading || !isLoaded;

  // The value to be provided to consumers
  const value = {
    isLoading,
    hasContext,
    contextCompleted,
    refetchProfile: refetch,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
} 