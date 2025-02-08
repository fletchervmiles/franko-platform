import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatInstancesTable, type InsertChatInstance, type SelectChatInstance } from "../schema/chat-instances-schema";

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

export async function updateChatInstanceInterviewGuide(
  id: string,
  interviewGuide: string
): Promise<SelectChatInstance | undefined> {
  const [updatedChatInstance] = await db
    .update(chatInstancesTable)
    .set({ interviewGuide })
    .where(eq(chatInstancesTable.id, id))
    .returning();
  return updatedChatInstance;
} 