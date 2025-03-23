/**
 * Safe Auth Utility
 * 
 * A wrapper around Clerk's auth() function that handles routes excluded from
 * middleware matcher patterns gracefully by providing fallbacks.
 */

import { auth as clerkAuth } from "@clerk/nextjs/server";

/**
 * Safely get authentication info, with fallbacks for routes excluded from middleware
 * 
 * @returns An object with auth info or null values if auth() fails
 */
export async function safeAuth() {
  try {
    // Try to get auth info from Clerk
    return await clerkAuth();
  } catch (error) {
    // If there's an error (likely because the route is excluded from middleware),
    // return a fallback object with null values
    console.warn("Auth error (safe fallback provided):", 
      error instanceof Error ? error.message : String(error)
    );
    
    return {
      userId: null,
      sessionId: null,
      getToken: async () => null,
      session: null,
      user: null,
      organization: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: () => false,
      sessionClaims: null,
    };
  }
} 