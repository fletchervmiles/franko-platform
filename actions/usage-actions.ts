'use server'

import { calculateUsageMetrics } from "@/lib/account-management";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

interface UsageMetrics {
  totalLifetimeMinutes: number;
  minutesUsedThisMonth: number;
  remainingMinutes: number;
  monthlyQuota: number;
}

export async function fetchUsageMetrics(userId: string): Promise<UsageMetrics> {
  return calculateUsageMetrics(userId);
} 