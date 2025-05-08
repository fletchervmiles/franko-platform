'use client';

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { syncClerkProfileAction } from "@/actions/profiles-actions";

export function ClerkProfileSync() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      syncClerkProfileAction();
    }
  }, [isSignedIn]);

  return null; // This component doesn't render anything
} 