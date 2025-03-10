import { db } from "@/db/db";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { profilesTable } from "@/db/schema/profiles-schema";
import { and, eq, gte } from "drizzle-orm";

export interface UsageMetrics {
  totalLifetimeMinutes: number;
  minutesUsedThisMonth: number;
  remainingMinutes: number;
  monthlyQuota: number;
}

export async function calculateUsageMetrics(userId: string): Promise<UsageMetrics> {
  // Get the user's profile for their monthly quota
  const profile = await db.query.profiles.findFirst({
    where: eq(profilesTable.userId, userId),
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  // Calculate start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Get all chat responses for total lifetime minutes
  const allResponses = await db.query.chatResponses.findMany({
    where: eq(chatResponsesTable.userId, userId),
  });

  // Get chat responses for current month
  const currentMonthResponses = await db.query.chatResponses.findMany({
    where: and(
      eq(chatResponsesTable.userId, userId),
      gte(chatResponsesTable.interviewEndTime, startOfMonth)
    ),
  });

  // Calculate metrics
  const totalLifetimeMinutes = allResponses.reduce(
    (sum, response) => sum + (response.totalInterviewMinutes || 0),
    0
  );

  const minutesUsedThisMonth = currentMonthResponses.reduce(
    (sum, response) => sum + (response.totalInterviewMinutes || 0),
    0
  );

  const monthlyQuota = profile.monthlyResponsesQuota || 0;
  const remainingMinutes = Math.max(0, monthlyQuota - minutesUsedThisMonth);

  return {
    totalLifetimeMinutes,
    minutesUsedThisMonth,
    remainingMinutes,
    monthlyQuota,
  };
} 