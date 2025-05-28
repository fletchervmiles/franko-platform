import { db } from "../db";
import { userOnboardingStatusTable, SelectUserOnboardingStatus, InsertUserOnboardingStatus } from "../schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Fetches the onboarding status for a user.
 * If no status exists, it creates a default entry (all steps false).
 * @param userId - The ID of the user.
 * @returns The user's onboarding status, or null if an error occurs during creation.
 */
export async function getOnboardingStatus(userId: string): Promise<SelectUserOnboardingStatus | null> {
  try {
    let status = await db.query.userOnboardingStatus.findFirst({
      where: eq(userOnboardingStatusTable.userId, userId),
    });

    if (!status) {
      logger.info(`No onboarding status found for user ${userId}. Creating default entry.`);
      try {
        const defaultStatus: InsertUserOnboardingStatus = {
          userId,
          // Defaults are set in the schema, so we only need userId
        };
        const inserted = await db
          .insert(userOnboardingStatusTable)
          .values(defaultStatus)
          .returning();
          
        if (inserted.length > 0) {
           status = inserted[0];
           logger.info(`Default onboarding status created successfully for user ${userId}.`);
        } else {
            logger.error(`Failed to insert or retrieve default onboarding status for user ${userId}.`);
            return null; // Indicate failure to create/retrieve
        }
      } catch (creationError) {
        logger.error(`Error creating default onboarding status for user ${userId}:`, creationError);
        return null; // Indicate failure
      }
    }
    
    return status;
  } catch (error) {
    logger.error(`Error fetching onboarding status for user ${userId}:`, error);
    return null;
  }
}

type OnboardingStepKey = keyof Omit<InsertUserOnboardingStatus, 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * Updates a specific onboarding step to true for a user, only if it's currently false.
 * @param userId - The ID of the user.
 * @param stepKey - The key of the step to update (e.g., 'step1ContextComplete').
 * @returns The updated onboarding status, or null if an error occurs or the user/step is invalid.
 */
export async function updateOnboardingStep(userId: string, stepKey: OnboardingStepKey): Promise<SelectUserOnboardingStatus | null> {
  // Validate stepKey to prevent accidental updates to other fields
  const validSteps: OnboardingStepKey[] = [
    'step1ContextComplete',
    'step2BrandingComplete',
    'step3PersonasReviewed',
    'step4AgentCreated',
    'step5LinkShared'
  ];
  
  if (!validSteps.includes(stepKey)) {
    logger.warn(`Invalid onboarding step key provided: ${stepKey} for user ${userId}`);
    return null;
  }

  try {
    // First, ensure the user has an onboarding status entry
    const currentStatus = await getOnboardingStatus(userId);
    if (!currentStatus) {
        logger.error(`Could not find or create onboarding status for user ${userId} before updating step ${stepKey}.`);
        return null;
    }

    // Only update if the step is currently false
    if (currentStatus[stepKey] === false) {
      logger.info(`Updating onboarding step ${stepKey} to true for user ${userId}.`);
      const updated = await db
        .update(userOnboardingStatusTable)
        .set({ 
            [stepKey]: true, 
            updatedAt: new Date() // Manually update timestamp
        })
        .where(eq(userOnboardingStatusTable.userId, userId))
        .returning();

      if (updated.length > 0) {
        logger.info(`Successfully updated step ${stepKey} for user ${userId}.`);
        return updated[0];
      } else {
        logger.warn(`Update operation for step ${stepKey} for user ${userId} returned no results. Status might not exist or condition failed.`);
        // Return the potentially outdated status we fetched earlier, as the update didn't apply
        return currentStatus; 
      }
    } else {
      logger.info(`Onboarding step ${stepKey} is already true for user ${userId}. No update needed.`);
      return currentStatus; // Return current status if already true
    }
  } catch (error) {
    logger.error(`Error updating onboarding step ${stepKey} for user ${userId}:`, error);
    return null;
  }
}

/**
 * Marks all onboarding steps as complete for a user.
 * This is typically used when a user explicitly chooses to skip the remaining steps.
 * @param userId - The ID of the user.
 * @returns The updated onboarding status, or null if an error occurs or the user status doesn't exist.
 */
export async function forceCompleteOnboarding(userId: string): Promise<SelectUserOnboardingStatus | null> {
  try {
    // Ensure the user has an onboarding status entry first.
    // getOnboardingStatus creates one if it doesn't exist.
    const currentStatus = await getOnboardingStatus(userId);
    if (!currentStatus) {
      logger.error(`Could not find or create onboarding status for user ${userId} before force-completing.`);
      return null;
    }

    logger.info(`Force completing all onboarding steps for user ${userId}.`);
    const updated = await db
      .update(userOnboardingStatusTable)
      .set({
        step1ContextComplete: true,
        step2BrandingComplete: true,
        step3PersonasReviewed: true,
        step4AgentCreated: true,
        step5LinkShared: true,
        updatedAt: new Date() // Manually update timestamp
      })
      .where(eq(userOnboardingStatusTable.userId, userId))
      .returning();

    if (updated.length > 0) {
      logger.info(`Successfully force-completed onboarding for user ${userId}.`);
      return updated[0];
    } else {
      // This case should be rare if getOnboardingStatus worked, but handle it.
      logger.warn(`Force complete update operation for user ${userId} returned no results.`);
      return null; 
    }
  } catch (error) {
    logger.error(`Error force-completing onboarding for user ${userId}:`, error);
    return null;
  }
} 