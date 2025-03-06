'use server'

import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatInstancesTable, type InsertChatInstance, type SelectChatInstance, type ObjectiveProgress } from "../schema/chat-instances-schema";
import { arrayToNumberedObjectives, numberedObjectivesToArray, type ConversationPlan } from "@/components/conversationPlanSchema";
import { revalidatePath } from "next/cache";

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

export async function getChatInstanceById(id: string): Promise<SelectChatInstance | undefined> {
  try {
    const [chat] = await db
      .select()
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.id, id));
    return chat;
  } catch (error) {
    console.error("Failed to get chat instance:", error);
    throw new Error("Failed to get chat instance");
  }
}

export async function getChatInstancesByUserId(userId: string): Promise<SelectChatInstance[]> {
  return await db
    .select()
    .from(chatInstancesTable)
    .where(eq(chatInstancesTable.userId, userId))
    .orderBy(desc(chatInstancesTable.createdAt));
}

export async function updateChatInstance(
  id: string,
  updates: Partial<InsertChatInstance>
): Promise<SelectChatInstance | undefined> {
  const [updatedChatInstance] = await db
    .update(chatInstancesTable)
    .set(updates)
    .where(eq(chatInstancesTable.id, id))
    .returning();
  return updatedChatInstance;
}

export async function deleteChatInstance(id: string): Promise<void> {
  await db
    .delete(chatInstancesTable)
    .where(eq(chatInstancesTable.id, id));
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

export async function getConversationPlan(id: string): Promise<ConversationPlan | null> {
  try {
    const chatInstance = await getChatInstanceById(id);
    
    if (!chatInstance?.conversationPlan) {
      return null;
    }
    
    const dbPlan = chatInstance.conversationPlan as any;
    
    // Check if the objectives are already in array format (for backward compatibility)
    if (Array.isArray(dbPlan.objectives)) {
      return dbPlan as ConversationPlan;
    }
    
    // Convert the numbered objectives back to an array for frontend consumption
    const uiPlan: ConversationPlan = {
      ...dbPlan,
      objectives: numberedObjectivesToArray(dbPlan.objectives)
    };
    
    return uiPlan;
  } catch (error) {
    console.error("Error getting conversation plan:", error);
    throw error;
  }
}

export async function updateChatInstanceProgress(
  chatId: string,
  progress: ObjectiveProgress
) {
  await db
    .update(chatInstancesTable)
    .set({ objectiveProgress: progress })
    .where(eq(chatInstancesTable.id, chatId));
  
  console.log('Updated objective progress:', {
    chatId,
    progress,
    timestamp: new Date().toISOString()
  });
}

/**
 * Gets the chat instance progress for a chat.
 * Optimized to only select the required column and use indexing.
 * 
 * @param chatId The ID of the chat instance
 * @returns The objective progress or null if not found
 */
export async function getChatInstanceProgress(
  chatId: string
): Promise<ObjectiveProgress | null> {
  try {
    const result = await db
      .select({ objectiveProgress: chatInstancesTable.objectiveProgress })
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.id, chatId))
      .limit(1);

    return result[0]?.objectiveProgress as ObjectiveProgress | null;
  } catch (error) {
    console.error('Error fetching chat instance progress:', error);
    // Return null on error rather than throwing, for more graceful degradation
    return null;
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
): Promise<ObjectiveProgress | null> {
  // Use a single transaction for the entire operation to reduce roundtrips
  return await db.transaction(async (tx) => {
    try {
      // Get current progress within the transaction
      const [result] = await tx
        .select({ objectiveProgress: chatInstancesTable.objectiveProgress })
        .from(chatInstancesTable)
        .where(eq(chatInstancesTable.id, chatId))
        .limit(1);

      const currentProgress = result?.objectiveProgress as ObjectiveProgress | null;
      if (!currentProgress) {
        console.error('No progress found for chat:', chatId);
        return null;
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
          updatedProgress.objectives[objectiveKey] = { status: 'tbc' };
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
  }
): Promise<SelectChatInstance | undefined> {
  try {
    const [updatedChatInstance] = await db
      .update(chatInstancesTable)
      .set(updates)
      .where(eq(chatInstancesTable.id, id))
      .returning();
    
    return updatedChatInstance;
  } catch (error) {
    console.error("Error updating chat instance fields:", error);
    throw new Error("Failed to update chat instance fields");
  }
} 