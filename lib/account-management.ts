import { db } from "@/db/db";
import { interviewsTable } from "@/db/schema/interviews-schema";
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

  // Get all interviews for total lifetime minutes
  const allInterviews = await db.query.interviews.findMany({
    where: eq(interviewsTable.userId, userId),
  });

  // Get interviews for current month
  const currentMonthInterviews = await db.query.interviews.findMany({
    where: and(
      eq(interviewsTable.userId, userId),
      gte(interviewsTable.dateCompleted, startOfMonth)
    ),
  });

  // Calculate metrics
  const totalLifetimeMinutes = allInterviews.reduce(
    (sum, interview) => sum + (interview.totalInterviewMinutes || 0),
    0
  );

  const minutesUsedThisMonth = currentMonthInterviews.reduce(
    (sum, interview) => sum + (interview.totalInterviewMinutes || 0),
    0
  );

  const monthlyQuota = profile.monthlyMinutes || 0;
  const remainingMinutes = Math.max(0, monthlyQuota - minutesUsedThisMonth);

  return {
    totalLifetimeMinutes,
    minutesUsedThisMonth,
    remainingMinutes,
    monthlyQuota,
  };
} 