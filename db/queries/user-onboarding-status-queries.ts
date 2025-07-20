import { db } from "../db";
import { userOnboardingStatusTable, SelectUserOnboardingStatus, InsertUserOnboardingStatus } from "../schema";
import { eq, and, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getProfileByUserId, createProfile } from "./profiles-queries";
import { PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS } from "@/lib/stripe";

/**
 * Fetches the onboarding status for a user.
 * If no status exists, it creates a default entry (all steps false).
 * Ensures a profile exists before creating onboarding status to prevent foreign key violations.
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
        // First, ensure the user has a profile to satisfy foreign key constraint
        let profile = await getProfileByUserId(userId);
        if (!profile) {
          logger.info(`No profile found for user ${userId}. Creating minimal profile.`);
          try {
            profile = await createProfile({
              userId,
              membership: "free",
              totalResponsesQuota: PLAN_RESPONSES.free,
              totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES.free,
              totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS.free,
              totalResponsesAvailable: PLAN_RESPONSES.free,
              totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES.free,
              totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS.free,
            });
            logger.info(`Minimal profile created successfully for user ${userId}.`);
          } catch (profileError) {
            logger.error(`Error creating profile for user ${userId}:`, profileError);
            return null;
          }
        }

        // Now create the onboarding status
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

type OnboardingStepKey = keyof Omit<InsertUserOnboardingStatus, 'userId' | 'createdAt' | 'updatedAt' | 'processingStatus' | 'errorMessage' | 'startedAt' | 'completedAt'>;

type AutomatedOnboardingStepKey = 
  | 'step1XaAiComplete'
  | 'step2ContextReportComplete' 
  | 'step3BrandFetchComplete'
  | 'step4ConversationPlansComplete'
  | 'step5ModalCreated';

type ProcessingStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

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
    'step5LinkShared',
    'step1XaAiComplete',
    'step2ContextReportComplete',
    'step3BrandFetchComplete',
    'step4ConversationPlansComplete',
    'step5ModalCreated'
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

// ===== AUTOMATED ONBOARDING FUNCTIONS =====

/**
 * Starts the automated onboarding process for a user
 * @param userId - The ID of the user
 * @returns The updated onboarding status, or null if error occurs
 */
export async function startAutomatedOnboarding(userId: string): Promise<SelectUserOnboardingStatus | null> {
  try {
    // Ensure the user has an onboarding status entry
    const currentStatus = await getOnboardingStatus(userId);
    if (!currentStatus) {
      logger.error(`Could not find or create onboarding status for user ${userId} before starting automated onboarding.`);
      return null;
    }

    logger.info(`Starting automated onboarding for user ${userId}.`);
    const updated = await db
      .update(userOnboardingStatusTable)
      .set({
        processingStatus: 'in_progress',
        startedAt: new Date(),
        errorMessage: null, // Clear any previous errors
        updatedAt: new Date()
      })
      .where(eq(userOnboardingStatusTable.userId, userId))
      .returning();

    if (updated.length > 0) {
      logger.info(`Successfully started automated onboarding for user ${userId}.`);
      return updated[0];
    } else {
      logger.warn(`Start automated onboarding update operation for user ${userId} returned no results.`);
      return null;
    }
  } catch (error) {
    logger.error(`Error starting automated onboarding for user ${userId}:`, error);
    return null;
  }
}

/**
 * Updates a specific automated onboarding step to true
 * @param userId - The ID of the user  
 * @param stepKey - The automated onboarding step to update
 * @returns The updated onboarding status, or null if error occurs
 */
export async function updateAutomatedOnboardingStep(
  userId: string, 
  stepKey: AutomatedOnboardingStepKey
): Promise<SelectUserOnboardingStatus | null> {
  try {
    const currentStatus = await getOnboardingStatus(userId);
    if (!currentStatus) {
      logger.error(`Could not find onboarding status for user ${userId} before updating automated step ${stepKey}.`);
      return null;
    }

    // Only update if the step is currently false
    if (currentStatus[stepKey] === false) {
      logger.info(`Updating automated onboarding step ${stepKey} to true for user ${userId}.`);
      const updated = await db
        .update(userOnboardingStatusTable)
        .set({ 
          [stepKey]: true,
          updatedAt: new Date()
        })
        .where(eq(userOnboardingStatusTable.userId, userId))
        .returning();

      if (updated.length > 0) {
        logger.info(`Successfully updated automated step ${stepKey} for user ${userId}.`);
        return updated[0];
      } else {
        logger.warn(`Update operation for automated step ${stepKey} for user ${userId} returned no results.`);
        return currentStatus;
      }
    } else {
      logger.info(`Automated onboarding step ${stepKey} is already true for user ${userId}. No update needed.`);
      return currentStatus;
    }
  } catch (error) {
    logger.error(`Error updating automated onboarding step ${stepKey} for user ${userId}:`, error);
    return null;
  }
}

/**
 * Completes the automated onboarding process successfully
 * @param userId - The ID of the user
 * @returns The updated onboarding status, or null if error occurs
 */
export async function completeAutomatedOnboarding(userId: string): Promise<SelectUserOnboardingStatus | null> {
  try {
    logger.info(`Completing automated onboarding for user ${userId}.`);
    const updated = await db
      .update(userOnboardingStatusTable)
      .set({
        processingStatus: 'completed',
        completedAt: new Date(),
        errorMessage: null, // Clear any previous errors
        updatedAt: new Date()
      })
      .where(eq(userOnboardingStatusTable.userId, userId))
      .returning();

    if (updated.length > 0) {
      logger.info(`Successfully completed automated onboarding for user ${userId}.`);
      return updated[0];
    } else {
      logger.warn(`Complete automated onboarding update operation for user ${userId} returned no results.`);
      return null;
    }
  } catch (error) {
    logger.error(`Error completing automated onboarding for user ${userId}:`, error);
    return null;
  }
}

/**
 * Marks the automated onboarding as failed with an error message
 * @param userId - The ID of the user
 * @param errorMessage - The error message to store
 * @returns The updated onboarding status, or null if error occurs
 */
export async function failAutomatedOnboarding(
  userId: string, 
  errorMessage: string
): Promise<SelectUserOnboardingStatus | null> {
  try {
    logger.info(`Failing automated onboarding for user ${userId} with error: ${errorMessage}`);
    const updated = await db
      .update(userOnboardingStatusTable)
      .set({
        processingStatus: 'failed',
        errorMessage: errorMessage,
        updatedAt: new Date()
      })
      .where(eq(userOnboardingStatusTable.userId, userId))
      .returning();

    if (updated.length > 0) {
      logger.info(`Successfully marked automated onboarding as failed for user ${userId}.`);
      return updated[0];
    } else {
      logger.warn(`Fail automated onboarding update operation for user ${userId} returned no results.`);
      return null;
    }
  } catch (error) {
    logger.error(`Error failing automated onboarding for user ${userId}:`, error);
    return null;
  }
}

/**
 * Gets users who are currently in automated onboarding process
 * @returns Array of users with in_progress status
 */
export async function getUsersInProgress(): Promise<SelectUserOnboardingStatus[]> {
  try {
    const users = await db.query.userOnboardingStatus.findMany({
      where: eq(userOnboardingStatusTable.processingStatus, 'in_progress'),
    });
    return users;
  } catch (error) {
    logger.error(`Error fetching users in automated onboarding progress:`, error);
    return [];
  }
}

/**
 * Resets stuck automation processes that have been running for more than the specified timeout
 * @param timeoutMinutes - Number of minutes after which to consider a process stuck (default: 10)
 * @returns Number of processes reset
 */
export async function resetStuckAutomationProcesses(timeoutMinutes: number = 10): Promise<number> {
  try {
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    logger.info(`Checking for automation processes stuck longer than ${timeoutMinutes} minutes (before ${timeoutDate.toISOString()})`);
    
    const stuckProcesses = await db
      .update(userOnboardingStatusTable)
      .set({
        processingStatus: 'failed',
        errorMessage: `Process timed out after ${timeoutMinutes} minutes`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userOnboardingStatusTable.processingStatus, 'in_progress'),
          lt(userOnboardingStatusTable.startedAt, timeoutDate)
        )
      )
      .returning({ userId: userOnboardingStatusTable.userId });

    if (stuckProcesses.length > 0) {
      logger.warn(`Reset ${stuckProcesses.length} stuck automation processes:`, stuckProcesses.map(p => p.userId));
    } else {
      logger.info('No stuck automation processes found');
    }

    return stuckProcesses.length;
  } catch (error) {
    logger.error(`Error resetting stuck automation processes:`, error);
    return 0;
  }
}