'use server'

import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatInstancesTable, type InsertChatInstance, type SelectChatInstance, type ObjectiveProgress } from "../schema/chat-instances-schema";
import type { ConversationPlan } from "@/components/conversationPlanSchema";
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
    const [result] = await db
      .update(chatInstancesTable)
      .set({ 
        conversationPlan,
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
    return chatInstance?.conversationPlan as ConversationPlan || null;
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

export async function getChatInstanceProgress(
  chatId: string
): Promise<ObjectiveProgress | null> {
  const result = await db
    .select({ objectiveProgress: chatInstancesTable.objectiveProgress })
    .from(chatInstancesTable)
    .where(eq(chatInstancesTable.id, chatId))
    .limit(1);

  return result[0]?.objectiveProgress as ObjectiveProgress | null;
}

/**
 * Updates objective progress programmatically, ensuring that when an objective is marked as "done",
 * the next objective automatically becomes "current".
 * 
 * @param chatId The ID of the chat instance
 * @param updates An array of updates to apply, each with a path and value
 * @returns The updated ObjectiveProgress
 */
export async function updateObjectiveProgressProgrammatically(
  chatId: string,
  updates: Array<{ path: string; value: string }>
): Promise<ObjectiveProgress | null> {
  try {
    // Get current progress
    const currentProgress = await getChatInstanceProgress(chatId);
    if (!currentProgress) {
      console.error('No progress found for chat:', chatId);
      return null;
    }

    // Create a deep copy of the current progress
    const updatedProgress: ObjectiveProgress = JSON.parse(JSON.stringify(currentProgress));
    
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
      
      // If no next objective was set as current (all are done), don't change anything
      if (!nextCurrentSet) {
        console.log('All objectives are done or no next objective found');
      }
    }
    
    // Save the updated progress
    await updateChatInstanceProgress(chatId, updatedProgress);
    
    return updatedProgress;
  } catch (error) {
    console.error('Error updating objective progress programmatically:', error);
    throw error;
  }
} 