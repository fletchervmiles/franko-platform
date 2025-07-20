'use client';

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { queryClient } from "./query-provider";
import { queryKeys } from "@/lib/queryKeys";

export function ClerkProfileSync() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const performSync = async () => {
        let profileSyncedSuccessfully = false;
        try {
          console.log(`🔄 ClerkProfileSync: Starting sync for user ${user.id}`);
          
          const response = await fetch('/api/user/sync-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ ClerkProfileSync: Profile sync successful for user ${user.id}`, result);
            profileSyncedSuccessfully = true;
            
            // If this is a new business email user, redirect to automated onboarding
            if (result.isNewUser && user.primaryEmailAddress?.emailAddress) {
              const email = user.primaryEmailAddress.emailAddress;
              const domain = email.split('@')[1]?.toLowerCase();
              
              // List of personal email domains  
              const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
              const isBusinessEmail = !personalDomains.includes(domain);
              
              if (isBusinessEmail) {
                console.log(`🚀 New business user detected: ${user.id}, redirecting to auto-onboarding`);
                const companyName = domain.split('.')[0];
                window.location.href = `/onboarding/auto?company=${encodeURIComponent(companyName)}`;
                return;
              } else {
                console.log(`👤 New personal email user detected: ${user.id}, redirecting to manual setup`);
                window.location.href = '/context-setup';
                return;
              }
            }
          } else {
            const errorData = await response.json();
            console.error(`❌ ClerkProfileSync: Profile sync failed for user ${user.id}:`, errorData.error);
            
            // Handle personal email rejection
            if (response.status === 403 && errorData.shouldRedirect) {
              console.log(`🚫 Personal email blocked, redirecting to: ${errorData.redirectUrl}`);
              // Show an alert and redirect
              alert(errorData.error);
              window.location.href = errorData.redirectUrl;
              return;
            }
          }
        } catch (error) {
          console.error(`❌ ClerkProfileSync: Error during profile sync for user ${user.id}:`, error);
        }

        if (!profileSyncedSuccessfully) {
          console.warn(`⚠️ ClerkProfileSync: Invalidating queries for user ${user.id} despite sync issues. Dependent queries might fail if profile doesn't exist.`);
        }

        // Always invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id), refetchType: 'active' });
      };
      
      performSync();
    }
  }, [isSignedIn, user?.id]);

  return null; // This component doesn't render anything
} 