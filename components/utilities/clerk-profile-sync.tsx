'use client';

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { syncClerkProfileAction } from "@/actions/profiles-actions";
import { queryClient } from "./query-provider";
import { queryKeys } from "@/lib/queryKeys";

export function ClerkProfileSync() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const performSync = async () => {
        let profileSyncedSuccessfully = false;
        try {
          console.log(`ClerkProfileSync: Starting sync for user ${user.id}`);
          const syncResult = await syncClerkProfileAction();
          if (syncResult.status === "success") {
            console.log(`ClerkProfileSync: Profile sync/creation successful for user ${user.id}`);
            profileSyncedSuccessfully = true;
          } else {
            console.error(`ClerkProfileSync: Profile sync failed for user ${user.id}:`, syncResult.message);
          }
        } catch (error) {
          console.error(`ClerkProfileSync: Error during syncClerkProfileAction for user ${user.id}:`, error);
        }

        if (!profileSyncedSuccessfully) {
            console.warn(`ClerkProfileSync: Invalidating queries for user ${user.id} despite sync issues. Dependent queries might fail if profile doesn't exist.`);
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id), refetchType: 'active' });
      };
      performSync();
    }
  }, [isSignedIn, user?.id]);

  return null; // This component doesn't render anything
} 