import { SelectProfile } from "@/db/schema/profiles-schema";

/**
 * Interface for UI-ready usage data format
 */
export interface UiUsageData {
  responses: {
    used: number;
    total: number;
    percentage: number;
  };
  conversationPlans: {
    used: number;
    total: number;
    percentage: number;
  };
  qaMessages: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * Transforms a profile's usage data from the database format to the UI-ready format
 */
export function formatProfileToUiUsageData(profile: SelectProfile): UiUsageData {
  // Calculate percentages, ensuring we don't divide by zero
  const calculatePercentage = (used: number, quota: number) => {
    if (quota === 0) return 0;
    const percentage = Math.round((used / quota) * 100);
    return Math.min(100, Math.max(0, percentage)); // Clamp between 0-100
  };

  return {
    responses: {
      used: profile.totalResponsesUsed || 0,
      total: profile.totalResponsesQuota || 0,
      percentage: calculatePercentage(profile.totalResponsesUsed || 0, profile.totalResponsesQuota || 0),
    },
    conversationPlans: {
      used: profile.totalChatInstanceGenerationsUsed || 0,
      total: profile.totalChatInstanceGenerationsQuota || 0,
      percentage: calculatePercentage(
        profile.totalChatInstanceGenerationsUsed || 0, 
        profile.totalChatInstanceGenerationsQuota || 0
      ),
    },
    qaMessages: {
      used: profile.totalInternalChatQueriesUsed || 0,
      total: profile.totalInternalChatQueriesQuota || 0,
      percentage: calculatePercentage(
        profile.totalInternalChatQueriesUsed || 0,
        profile.totalInternalChatQueriesQuota || 0
      ),
    },
  };
} 