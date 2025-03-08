/**
 * Usage Tracker Utility
 * 
 * Tracks usage of chat responses by incrementing the total_responses_used_this_month
 * field in the user's profile when a conversation has a completion rate > 50%.
 */

import { db } from "@/db/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Updates the usage count for a user based on the completion rate
 * 
 * @param userId - The user ID
 * @param completionRate - The completion rate as a number or string (e.g., 75 or "75%")
 * @returns Promise that resolves when the update is complete
 */
export async function updateUsageCount(
  userId: string, 
  completionRate: number | string
): Promise<void> {
  try {
    // Parse the completion rate if it's a string
    let rate: number;
    
    if (typeof completionRate === 'string') {
      // Remove the % sign and convert to number
      rate = parseInt(completionRate.replace('%', ''), 10);
    } else {
      rate = completionRate;
    }
    
    // Only increment if completion rate is > 50%
    if (isNaN(rate) || rate <= 50) {
      logger.debug('Skipping usage update, completion rate <= 50%', { userId, completionRate: rate });
      return;
    }
    
    // Increment the total_responses_used_this_month field
    await db.transaction(async (tx) => {
      // Get the current profile first
      const profile = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.userId, userId))
        .limit(1);
      
      if (profile.length === 0) {
        logger.warn('Profile not found for user', { userId });
        return;
      }
      
      // Safely increment the counters using the existing values
      const currentTotal = profile[0].totalResponsesUsed || 0;
      const currentMonthly = profile[0].totalResponsesUsedThisMonth || 0;
      
      await tx.update(profilesTable)
        .set({ 
          totalResponsesUsedThisMonth: currentMonthly + 1,
          totalResponsesUsed: currentTotal + 1
        })
        .where(eq(profilesTable.userId, userId));
        
      logger.debug('Updated usage counters', { 
        userId,
        prevTotal: currentTotal,
        newTotal: currentTotal + 1,
        prevMonthly: currentMonthly,
        newMonthly: currentMonthly + 1
      });
    });
    
    logger.info('Updated usage count for user', { userId, completionRate: rate });
  } catch (error) {
    logger.error('Error updating usage count:', error);
    throw error;
  }
}