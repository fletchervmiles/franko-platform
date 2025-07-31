'use server'

import { and, desc, eq, sql, count } from "drizzle-orm";
import { db } from "../db";
import { chatInstancesTable, type InsertChatInstance, type SelectChatInstance, type ObjectiveProgress } from "../schema/chat-instances-schema";
import { profilesTable } from "../schema/profiles-schema";
import { arrayToNumberedObjectives, numberedObjectivesToArray, type ConversationPlan } from "@/components/conversationPlanSchema";
import { revalidatePath } from "next/cache";
import { LRUCache } from 'lru-cache';
import { chatResponsesTable } from "../schema/chat-responses-schema";
import { logger } from "@/lib/logger";
import { safeStringify } from '@/utils/db-utils';

// Cache for chat instances to reduce database load
const instanceCache = new LRUCache<string, SelectChatInstance>({
  max: 100,                 // Store up to 100 chat instances
  ttl: 1000 * 30,           // Cache for 30 seconds
  updateAgeOnGet: true,     // Extend TTL when accessed
  allowStale: true,         // Allow serving stale data briefly while refreshing
});

// Cache for conversation plans
const conversationPlanCache = new LRUCache<string, ConversationPlan>({
  max: 50,                  // Store up to 50 conversation plans
  ttl: 1000 * 60,           // Cache for 1 minute
  updateAgeOnGet: true,     // Extend TTL when accessed
});

// Cache for objective progress
const progressCache = new LRUCache<string, ObjectiveProgress>({
  max: 50,                  // Store up to 50 progress objects
  ttl: 1000 * 15,           // Cache for 15 seconds (shorter due to frequent updates)
  updateAgeOnGet: true,     // Extend TTL when accessed
});

export async function createChatInstance(chat: InsertChatInstance): Promise<SelectChatInstance> {
  try {
    const [newChat] = await db
      .insert(chatInstancesTable)
      .values(chat)
      .returning();
    return newChat;
  } catch (error) {
    console.error("Failed to create chat instance:", error);
    throw new Error("Failed to create chat instance");
  }
}

export async function getChatInstancesCountByUserId(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.userId, userId));

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Failed to get chat instances count for user:", { userId, error });
    return 0;
  }
}

export async function getChatInstanceById(id: string): Promise<SelectChatInstance | undefined> {
  try {
    // Check cache first to avoid database query
    const cachedInstance = instanceCache.get(id);
    if (cachedInstance) {
      console.log(`CACHE HIT: Using cached chat instance for ${id}`);
      return cachedInstance;
    }

    console.log(`CACHE MISS: Fetching chat instance ${id} from database`);
    
    // Not in cache, fetch from database
    const [chat] = await db
      .select()
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.id, id));
    
    // Store in cache if found
    if (chat) {
      instanceCache.set(id, chat);
    }
    
    return chat;
  } catch (error) {
    console.error("Failed to get chat instance:", error);
    throw new Error("Failed to get chat instance");
  }
}

export async function getChatInstancesByUserId(userId: string): Promise<SelectChatInstance[]> {
  console.log(`Fetching chat instances for userId: ${userId}`);
  
  try {
    // Test the database connection first
    await db.select({ one: sql`1` });
    console.log('Database connection test successful');
    
    // Add retry logic for production environment
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        const instances = await db
          .select()
          .from(chatInstancesTable)
          .where(eq(chatInstancesTable.userId, userId))
          .orderBy(desc(chatInstancesTable.createdAt));
          
        console.log(`Successfully fetched ${instances.length} chat instances for user ${userId}`);
        return instances;
      } catch (retryError) {
        retryCount++;
        
        if (retryCount > maxRetries) {
          throw retryError; // Re-throw if we've exhausted retries
        }
        
        console.log(`Retry ${retryCount}/${maxRetries} after error: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
      }
    }
    
    // This should never be reached due to the while loop, but TypeScript needs a return
    return [];
  } catch (error) {
    console.error("Failed to get chat instances for user:", {
      userId,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error)
    });
    
    // Rethrow with more context
    throw new Error(`Failed to get chat instances: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateChatInstance(
  id: string,
  updates: Partial<InsertChatInstance>
): Promise<SelectChatInstance | undefined> {
  try {
    const [updatedChatInstance] = await db
      .update(chatInstancesTable)
      .set(updates)
      .where(eq(chatInstancesTable.id, id))
      .returning();
    
    // Update cache with the updated instance
    if (updatedChatInstance) {
      instanceCache.set(id, updatedChatInstance);
      
      // Invalidate related caches if relevant fields are updated
      if (updates.conversationPlan) {
        conversationPlanCache.delete(id);
      }
      
      if (updates.objectiveProgress) {
        progressCache.delete(id);
      }
    }
    
    return updatedChatInstance;
  } catch (error) {
    console.error("Failed to update chat instance:", error);
    throw new Error("Failed to update chat instance");
  }
}

export async function deleteChatInstance(id: string): Promise<void> {
  try {
    await db
      .delete(chatInstancesTable)
      .where(eq(chatInstancesTable.id, id));
    
    // Clear all caches related to this instance
    instanceCache.delete(id);
    conversationPlanCache.delete(id);
    progressCache.delete(id);
  } catch (error) {
    console.error("Failed to delete chat instance:", error);
    throw new Error("Failed to delete chat instance");
  }
}

export async function updateChatInstanceMessages(
  id: string,
  messages: string
): Promise<SelectChatInstance | undefined> {
  const [updatedChatInstance] = await db
    .update(chatInstancesTable)
    .set({ messages })
    .where(eq(chatInstancesTable.id, id))
    .returning();
  return updatedChatInstance;
}

export async function updateChatInstanceConversationPlan(
  id: string,
  conversationPlan: ConversationPlan
): Promise<SelectChatInstance | undefined> {
  try {
    // Convert the objectives array to numbered objects format for database storage
    const dbPlan = {
      ...conversationPlan,
      // Store the objectives as numbered keys (objective01, objective02, etc.)
      objectives: arrayToNumberedObjectives(conversationPlan.objectives)
    };

    const [result] = await db
      .update(chatInstancesTable)
      .set({ 
        conversationPlan: dbPlan,
        conversationPlanLastEdited: new Date()
      })
      .where(eq(chatInstancesTable.id, id))
      .returning();
    return result;
  } catch (error) {
    console.error("Error updating chat instance conversation plan:", error);
    throw error;
  }
}

export async function getConversationPlan(id: string): Promise<ConversationPlan | undefined> {
  try {
    logger.info(`Retrieving conversation plan for chat ${id}`);
    
    // Check cache first
    const cachedPlan = conversationPlanCache.get(id);
    if (cachedPlan) {
      logger.info(`CACHE HIT: Using cached conversation plan for ${id}`);
      return cachedPlan;
    }
    
    logger.info(`CACHE MISS: Fetching conversation plan for ${id} from database`);
    
    // Optimize database query by selecting only the conversationPlan field
    // if the instance is not already cached
    let chatInstance: SelectChatInstance | undefined;
    
    if (instanceCache.has(id)) {
      // Use already cached instance
      chatInstance = instanceCache.get(id);
      logger.info(`Using cached chat instance for ${id}`);
    } else {
      // Only select the field we need
      logger.info(`Querying database for conversation plan ${id}`);
      const [result] = await db
        .select({ conversationPlan: chatInstancesTable.conversationPlan })
        .from(chatInstancesTable)
        .where(eq(chatInstancesTable.id, id))
        .limit(1);
      
      if (result) {
        chatInstance = { id, conversationPlan: result.conversationPlan } as SelectChatInstance;
        logger.info(`Found conversation plan in database for ${id}`);
      } else {
        logger.warn(`No conversation plan found in database for ${id}`);
      }
    }
    
    if (!chatInstance?.conversationPlan) {
      logger.warn(`No conversation plan data available for ${id}`);
      return undefined;
    }
    
    // Log the raw plan structure to help debug format issues
    logger.info(`Raw conversation plan structure:`, {
      chatId: id,
      planType: typeof chatInstance.conversationPlan,
      hasObjectives: Boolean(chatInstance.conversationPlan && (chatInstance.conversationPlan as any).objectives),
      objectivesType: typeof (chatInstance.conversationPlan as any).objectives,
      isObjectivesArray: Array.isArray((chatInstance.conversationPlan as any).objectives),
      objectivesKeys: (chatInstance.conversationPlan as any).objectives ? 
        (Array.isArray((chatInstance.conversationPlan as any).objectives) ? 
          'array' : 
          Object.keys((chatInstance.conversationPlan as any).objectives)) 
        : 'none'
    });
    
    const dbPlan = chatInstance.conversationPlan as any;

    // Validate minimum required plan structure
    if (!dbPlan || typeof dbPlan !== 'object') {
      logger.error(`Invalid conversation plan format for ${id} - not an object`);
      return createFallbackPlan(id);
    }

    // Ensure required properties exist
    if (!dbPlan.title || !dbPlan.summary || !dbPlan.duration) {
      logger.error(`Conversation plan ${id} missing required properties`, {
        hasTitle: Boolean(dbPlan.title),
        hasSummary: Boolean(dbPlan.summary),
        hasDuration: Boolean(dbPlan.duration)
      });
      
      // Add missing required properties with defaults
      if (!dbPlan.title) dbPlan.title = "Conversation Plan";
      if (!dbPlan.summary) dbPlan.summary = "Plan details unavailable";
      if (!dbPlan.duration) dbPlan.duration = "≈10 minutes";
    }
    
    // Check if the objectives are already in array format (for backward compatibility)
    try {
      let uiPlan: ConversationPlan;
      
      if (Array.isArray(dbPlan.objectives)) {
        // Already in correct format
        uiPlan = dbPlan as ConversationPlan;
        logger.info(`Plan ${id} objectives already in array format`);
      } else if (dbPlan.objectives && typeof dbPlan.objectives === 'object') {
        // Convert from numbered format
        uiPlan = {
          ...dbPlan,
          objectives: numberedObjectivesToArray(dbPlan.objectives)
        };
        logger.info(`Converted plan ${id} objectives from numbered format`);
      } else {
        // Create a minimal valid plan
        logger.warn(`Plan ${id} has invalid objectives format, creating fallback`);
        uiPlan = {
          ...dbPlan,
          objectives: [{
            objective: "Complete the conversation",
            desiredOutcome: "Successfully finish the intended discussion",
            agentGuidance: ["Guide the conversation naturally"],
            expectedConversationTurns: "5"
          }]
        };
      }
      
      // Log the converted plan structure
      logger.info(`Successfully processed conversation plan for ${id}`, {
        title: uiPlan.title,
        objectiveCount: uiPlan.objectives?.length || 0
      });
      
      // Cache the result
      conversationPlanCache.set(id, uiPlan);
      
      return uiPlan;
    } catch (conversionError) {
      logger.error(`Error converting objectives format for plan ${id}:`, {
        error: conversionError instanceof Error ? conversionError.message : String(conversionError),
        objectives: dbPlan.objectives ? JSON.stringify(dbPlan.objectives).substring(0, 200) + '...' : 'undefined'
      });
      
      // Return fallback plan instead of failing completely
      return createFallbackPlan(id);
    }
  } catch (error) {
    logger.error(`Error getting conversation plan for ${id}:`, {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Helper function to create a fallback plan when the original can't be processed
function createFallbackPlan(chatId: string): ConversationPlan {
  logger.info(`Creating fallback conversation plan for ${chatId}`);
  
  return {
    title: "Conversation Plan",
    duration: "10-15 minutes",
    summary: "This is a fallback plan created when the original plan could not be processed correctly.",
    objectives: [
      {
        objective: "Continue the conversation",
        desiredOutcome: "Complete the discussion as planned",
        agentGuidance: [
          "Guide the conversation naturally",
          "Focus on the original topic if possible",
          "Wrap up when appropriate"
        ],
        expectedConversationTurns: "5-10"
      }
    ]
  };
}

export async function updateChatInstanceProgress(
  chatId: string,
  progress: ObjectiveProgress
) {
  try {
    await db
      .update(chatInstancesTable)
      .set({ objectiveProgress: progress })
      .where(eq(chatInstancesTable.id, chatId));
    
    // Update the progress cache
    progressCache.set(chatId, progress);
    
    // Also update in the instance cache if it exists
    const cachedInstance = instanceCache.get(chatId);
    if (cachedInstance) {
      instanceCache.set(chatId, {
        ...cachedInstance,
        objectiveProgress: progress
      });
    }
    
    console.log('Updated objective progress:', {
      chatId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating chat instance progress:', error);
    throw error;
  }
}

/**
 * Gets the chat instance progress for a chat.
 * Optimized to only select the required column and use indexing.
 * Uses caching to reduce database load.
 * 
 * @param chatId The ID of the chat instance
 * @returns The objective progress or null if not found
 */
export async function getChatInstanceProgress(
  chatId: string
): Promise<ObjectiveProgress | undefined> {
  try {
    // Check progress cache first
    const cachedProgress = progressCache.get(chatId);
    if (cachedProgress) {
      console.log(`CACHE HIT: Using cached progress for ${chatId}`);
      return cachedProgress;
    }
    
    // Check instance cache next - might contain the progress
    const cachedInstance = instanceCache.get(chatId);
    if (cachedInstance?.objectiveProgress) {
      console.log(`CACHE HIT: Using progress from cached instance for ${chatId}`);
      const progress = cachedInstance.objectiveProgress as ObjectiveProgress;
      progressCache.set(chatId, progress);
      return progress;
    }
    
    console.log(`CACHE MISS: Fetching progress for ${chatId} from database`);
    
    // Not in cache, fetch from database with optimized query
    const result = await db
      .select({ objectiveProgress: chatInstancesTable.objectiveProgress })
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.id, chatId))
      .limit(1);

    const progress = result[0]?.objectiveProgress as ObjectiveProgress | undefined;
    
    // Cache the result if it exists
    if (progress) {
      progressCache.set(chatId, progress);
    }
    
    return progress;
  } catch (error) {
    console.error('Error fetching chat instance progress:', error);
    // Return undefined on error rather than throwing, for more graceful degradation
    return undefined;
  }
}

/**
 * Updates objective progress programmatically, ensuring that when an objective is marked as "done",
 * the next objective automatically becomes "current".
 * 
 * Optimized to use a single database transaction and structuredClone for better performance.
 * 
 * @param chatId The ID of the chat instance
 * @param updates An array of updates to apply, each with a path and value
 * @returns The updated ObjectiveProgress
 */
export async function updateObjectiveProgressProgrammatically(
  chatId: string,
  updates: Array<{ path: string; value: string }>
): Promise<ObjectiveProgress | undefined> {
  // Use a single transaction for the entire operation to reduce roundtrips
  return await db.transaction(async (tx) => {
    try {
      // Get current progress within the transaction
      const [result] = await tx
        .select({ objectiveProgress: chatInstancesTable.objectiveProgress })
        .from(chatInstancesTable)
        .where(eq(chatInstancesTable.id, chatId))
        .limit(1);

      const currentProgress = result?.objectiveProgress as ObjectiveProgress | undefined;
      if (!currentProgress) {
        console.error('No progress found for chat:', chatId);
        return undefined;
      }

      // Use structuredClone for better performance than JSON.parse/stringify
      const updatedProgress: ObjectiveProgress = structuredClone(currentProgress);
      
      // Track if any objective was marked as "done"
      let objectiveMarkedAsDone = false;
      let lastDoneObjectiveKey = '';
      
      // Apply each update
      for (const update of updates) {
        const pathParts = update.path.split('.');
        if (pathParts.length !== 3 || pathParts[0] !== 'objectives' || pathParts[2] !== 'status') {
          console.warn('Invalid update path:', update.path);
          continue;
        }
        
        const objectiveKey = pathParts[1];
        
        // Apply the update
        if (!updatedProgress.objectives[objectiveKey]) {
          updatedProgress.objectives[objectiveKey] = { 
            status: 'tbc',
            turns_used: 0,
            expected_min: 1,
            expected_max: 3
          };
        }
        
        // Check if an objective is being marked as "done"
        if (update.value === 'done') {
          objectiveMarkedAsDone = true;
          lastDoneObjectiveKey = objectiveKey;
        }
        
        updatedProgress.objectives[objectiveKey].status = update.value as "done" | "current" | "tbc";
      }
      
      // If an objective was marked as done, find the next one and set it as current
      if (objectiveMarkedAsDone) {
        // Get all objective keys and sort them
        const objectiveKeys = Object.keys(updatedProgress.objectives).sort();
        
        // Find the index of the last done objective
        const doneIndex = objectiveKeys.indexOf(lastDoneObjectiveKey);
        
        // Find the next objective that isn't already "done"
        let nextCurrentSet = false;
        for (let i = doneIndex + 1; i < objectiveKeys.length; i++) {
          const nextKey = objectiveKeys[i];
          if (updatedProgress.objectives[nextKey].status !== 'done') {
            // Set this objective as current
            updatedProgress.objectives[nextKey].status = 'current';
            nextCurrentSet = true;
            break;
          }
        }
      }
      
      // Save the updated progress within the same transaction
      await tx
        .update(chatInstancesTable)
        .set({ objectiveProgress: updatedProgress })
        .where(eq(chatInstancesTable.id, chatId));
      
      // Log the update without blocking the function return
      console.log('Updated objective progress:', {
        chatId,
        timestamp: new Date().toISOString()
      });
      
      return updatedProgress;
    } catch (error) {
      console.error('Error updating objective progress programmatically:', error);
      throw error;
    }
  });
}

/**
 * Updates the chat instance fields related to user assistance
 * 
 * @param id The ID of the chat instance
 * @param updates The fields to update
 * @returns The updated chat instance
 */
export async function updateChatInstanceFields(
  id: string,
  updates: {
    topic?: string;
    duration?: string;
    respondentContacts?: boolean;
    incentiveStatus?: boolean;
    incentiveCode?: string;
    incentiveDescription?: string;
    additionalDetails?: string;
    published?: boolean;
    welcomeDescription?: string;
    welcomeHeading?: string;
    welcomeCardDescription?: string;
  }
): Promise<SelectChatInstance | undefined> {
  try {
    const [updatedChatInstance] = await db
      .update(chatInstancesTable)
      .set(updates)
      .where(eq(chatInstancesTable.id, id))
      .returning();
    
    // Update cache if available
    if (updatedChatInstance) {
      instanceCache.set(id, updatedChatInstance);
    }
    
    return updatedChatInstance;
  } catch (error) {
    console.error("Error updating chat instance fields:", error);
    throw new Error("Failed to update chat instance fields");
  }
}

/**
 * Updates only the welcome description field of a chat instance
 * Used by the non-blocking welcome description generation process
 */
export async function updateWelcomeDescription(
  id: string,
  welcomeDescription: string,
  welcomeHeading?: string,
  welcomeCardDescription?: string
): Promise<void> {
  try {
    // Build update object with available fields
    const updateFields: Record<string, string> = { welcomeDescription };
    
    // Add optional fields if provided
    if (welcomeHeading) {
      updateFields.welcomeHeading = welcomeHeading;
    }
    
    if (welcomeCardDescription) {
      updateFields.welcomeCardDescription = welcomeCardDescription;
    }
    
    await db
      .update(chatInstancesTable)
      .set(updateFields)
      .where(eq(chatInstancesTable.id, id));
    
    // Update in the instance cache if it exists
    const cachedInstance = instanceCache.get(id);
    if (cachedInstance) {
      instanceCache.set(id, {
        ...cachedInstance,
        ...updateFields
      });
    }
    
    console.log(`Updated welcome content for chat ${id}`);
  } catch (error) {
    console.error("Error updating welcome content:", error);
    // Don't throw - this is a non-blocking operation
  }
}

/**
 * Gets chat instances with response data for analysis
 * 
 * This function fetches chat instances that have completed responses,
 * along with response counts and word counts for display in the analysis UI.
 * 
 * @param userId The user ID to fetch instances for
 * @returns An array of chat instances with response data
 */
export async function getChatInstancesWithResponses(userId: string) {
  try {
    console.log("Fetching chat instances with responses for user:", userId);
    
    // First, get all chat instances for the user
    const instances = await db
      .select()
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.userId, userId))
      .orderBy(desc(chatInstancesTable.createdAt));
    
    console.log(`Found ${instances.length} chat instances`);
    
    // For each instance, get its responses
    const instancesWithCounts = await Promise.all(
      instances.map(async (instance) => {
        try {
          // Get responses for this chat instance
          const responses = await db
            .select()
            .from(chatResponsesTable)
            .where(eq(chatResponsesTable.chatInstanceId, instance.id));
          
          // Filter to only include completed responses
          const completedResponses = responses.filter(
            response => response.status === 'completed'
          );
          
          // Calculate total user words from completed responses
          const totalWords = completedResponses.reduce((sum, response) => {
            // Convert to number if stored as string, default to 0 if undefined
            const userWords = response.user_words ? 
              (typeof response.user_words === 'string' ? parseInt(response.user_words, 10) : response.user_words) : 0;
            return sum + (isNaN(userWords) ? 0 : userWords);
          }, 0);
          
          return {
            ...instance,
            responseCount: completedResponses.length,
            totalWords
          };
        } catch (error) {
          console.error(`Error processing responses for instance ${instance.id}:`, error);
          return {
            ...instance,
            responseCount: 0,
            totalWords: 0
          };
        }
      })
    );
    
    return instancesWithCounts;
  } catch (error) {
    console.error("Error getting chat instances with responses:", error);
    throw new Error("Failed to get chat instances with responses");
  }
}

export async function getChatInstanceWithBranding(instanceId: string) {
  // No caching here as branding might change, and this is likely called less frequently than core instance data
  logger.info(`Fetching chat instance ${instanceId} with branding from database`);
  try {
    const result = await db
      .select({
        // Select desired fields from chatInstancesTable
        instanceId: chatInstancesTable.id,
        userId: chatInstancesTable.userId, // Needed for ownership checks if required later
        welcomeHeading: chatInstancesTable.welcomeHeading,
        welcomeCardDescription: chatInstancesTable.welcomeCardDescription,
        welcomeDescription: chatInstancesTable.welcomeDescription,
        respondentContacts: chatInstancesTable.respondentContacts,
        incentiveStatus: chatInstancesTable.incentiveStatus,
        incentiveDescription: chatInstancesTable.incentiveDescription,
        incentiveCode: chatInstancesTable.incentiveCode,
        responseEmailNotifications: chatInstancesTable.responseEmailNotifications,
        redirect_url: chatInstancesTable.redirect_url,
        // Select branding fields from profilesTable
        logoUrl: profilesTable.logoUrl,
        buttonColor: profilesTable.buttonColor,
        titleColor: profilesTable.titleColor,
      })
      .from(chatInstancesTable)
      .leftJoin(profilesTable, eq(chatInstancesTable.userId, profilesTable.userId)) // Join based on userId
      .where(eq(chatInstancesTable.id, instanceId))
      .limit(1);

    if (!result || result.length === 0) {
      logger.warn(`Chat instance ${instanceId} not found when fetching with branding.`);
      return null;
    }

    const instance = result[0];
    logger.info(`Successfully fetched chat instance ${instanceId} with branding.`);
    return instance; // Return the flat structure, API route will nest it

  } catch (error) {
    logger.error(`Failed to get chat instance ${instanceId} with branding:`, { error: error instanceof Error ? error.message : String(error) });
    throw new Error("Failed to get chat instance with branding");
  }
}