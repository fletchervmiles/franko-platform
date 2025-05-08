'use client';

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { syncClerkProfileAction } from "@/actions/profiles-actions";
import { queryClient } from "./query-provider";
import { queryKeys } from "@/lib/queryKeys";

export function ClerkProfileSync() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      (async () => {
        try {
          await syncClerkProfileAction();
          // ensure profile query is up to date immediately
          queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' });
          
          // Production environments may have race conditions - do a second invalidate after a delay
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' });
            console.log('Performed delayed profile invalidation after clerk sync');
          }, 1000);
        } catch (error) {
          console.error('Error in clerk profile sync:', error);
          // Still try to invalidate even on error, in case profile was created
          queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' });
        }
      })();
    }
  }, [isSignedIn, user?.id]);

  return null; // This component doesn't render anything
} 