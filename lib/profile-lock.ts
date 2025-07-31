/**
 * Profile Update Coordination System
 * 
 * Prevents race conditions during concurrent profile updates by serializing
 * operations per user. This is especially important during complex flows like
 * auto-onboarding where multiple systems might try to update the profile
 * simultaneously.
 */

import { logger } from '@/lib/logger';

// Map to track ongoing profile operations per user
const profileUpdateLocks = new Map<string, Promise<any>>();

/**
 * Executes a profile operation with exclusive access per user
 * 
 * @param userId - The user ID to lock operations for
 * @param operation - The async operation to execute
 * @returns Promise that resolves with the operation result
 */
export async function withProfileLock<T>(
  userId: string, 
  operation: () => Promise<T>
): Promise<T> {
  const operationId = Math.random().toString(36).substring(7);
  
  logger.debug(`Profile lock requested for user ${userId}`, { operationId });
  
  // Wait for any existing operation to complete
  const existingLock = profileUpdateLocks.get(userId);
  if (existingLock) {
    logger.debug(`Waiting for existing profile operation to complete for user ${userId}`, { operationId });
    try {
      await existingLock;
    } catch (error) {
      // Ignore errors from previous operations, they shouldn't block new ones
      logger.debug(`Previous profile operation failed for user ${userId}, continuing`, { operationId, error });
    }
  }
  
  // Create and register our operation promise
  const operationPromise = (async () => {
    try {
      logger.debug(`Starting profile operation for user ${userId}`, { operationId });
      const result = await operation();
      logger.debug(`Profile operation completed successfully for user ${userId}`, { operationId });
      return result;
    } catch (error) {
      logger.error(`Profile operation failed for user ${userId}`, { operationId, error });
      throw error;
    }
  })();
  
  profileUpdateLocks.set(userId, operationPromise);
  
  try {
    const result = await operationPromise;
    return result;
  } finally {
    // Clean up the lock
    if (profileUpdateLocks.get(userId) === operationPromise) {
      profileUpdateLocks.delete(userId);
      logger.debug(`Profile lock released for user ${userId}`, { operationId });
    }
  }
}

/**
 * Get the current number of active profile locks (for monitoring)
 */
export function getActiveLockCount(): number {
  return profileUpdateLocks.size;
}

/**
 * Clear all locks (for testing or emergency situations)
 */
export function clearAllLocks(): void {
  profileUpdateLocks.clear();
  logger.warn('All profile locks have been cleared');
}