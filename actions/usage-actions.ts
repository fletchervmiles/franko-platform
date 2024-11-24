'use server'

import { calculateUsageMetrics } from "@/lib/account-management";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export async function fetchUsageMetrics() {
  const user = await currentUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  return calculateUsageMetrics(user.id);
} 