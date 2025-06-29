'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { SelectProfile } from '@/db/schema/profiles-schema';

interface ProfileContextType {
  profile: SelectProfile | null;
  isLoading: boolean;
  hasContext: boolean;
  contextCompleted: boolean; // Legacy - might deprecate later
  highlightWorkspaceNavItem: boolean;
  setHighlightWorkspaceNavItem: Dispatch<SetStateAction<boolean>>;
  isCompanyComplete: boolean;
  setIsCompanyComplete: Dispatch<SetStateAction<boolean>>;
  isBrandingComplete: boolean;
  setIsBrandingComplete: Dispatch<SetStateAction<boolean>>;
  isOverallContextComplete: boolean;
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

// Provider component using useQuery
export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [highlightWorkspaceNavItem, setHighlightWorkspaceNavItem] = useState(false);
  const [isCompanyComplete, setIsCompanyComplete] = useState(false);
  const [isBrandingComplete, setIsBrandingComplete] = useState(false);

  const userId = user?.id;

  const {
    data: profile,
    isLoading: isQueryLoading,
    refetch: refetchProfile,
  } = useQuery<SelectProfile | null>({
    queryKey: queryKeys.profile(userId),
    enabled: isLoaded && !!userId, // wait until auth is ready
    queryFn: async () => {
      const res = await fetch("/api/user/profile", {
        credentials: "include",
      });

      if (!res.ok) {
        // Surface the error so react-query can transition to the error state
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `Failed to fetch profile: ${res.status}`);
      }

      const data = (await res.json()) as Record<string, any>;
      return "userId" in data ? (data as SelectProfile) : null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Update completion status based on fetched profile
  useEffect(() => {
    if (profile) { // Check if profile exists
      setIsCompanyComplete(!!profile.organisationDescriptionCompleted);
      setIsBrandingComplete(!!(profile.logoUrl || profile.buttonColor || profile.titleColor));
    }
  }, [profile]);

  const hasContext = !!profile?.organisationName && !!profile?.organisationUrl; // Optional chaining for safety
  const contextCompleted = !!profile?.organisationDescriptionCompleted; // Optional chaining for safety

  // Derived state for overall completion
  const isOverallContextComplete = isCompanyComplete && isBrandingComplete;

  const value = {
    profile: profile ?? null, // Ensure profile is null if undefined
    isLoading: isQueryLoading,
    hasContext,
    contextCompleted, 
    highlightWorkspaceNavItem,
    setHighlightWorkspaceNavItem,
    isCompanyComplete,
    setIsCompanyComplete,
    isBrandingComplete,
    setIsBrandingComplete,
    isOverallContextComplete,
    refetchProfile: refetchProfile || (() => {}), // Provide a stable refetch function
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}; 