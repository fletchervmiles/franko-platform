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
        await syncClerkProfileAction();
        // ensure profile query is up to date
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' });
      })();
    }
  }, [isSignedIn]);

  return null; // This component doesn't render anything
} 