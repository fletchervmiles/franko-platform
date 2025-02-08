"use server";

import { db } from "@/db/db";
import { eq, and } from "drizzle-orm";
import { InsertCreatorConversation, creatorConversationsTable, SelectCreatorConversation } from "../schema/conversations-schema";

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export const createConversation = async (data: InsertCreatorConversation) => {
  try {
    const [newConversation] = await db.insert(creatorConversationsTable).values(data).returning();
    return newConversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
};

export const getConversationById = async (id: string, userId: string) => {
  try {
    const conversation = await db
      .select()
      .from(creatorConversationsTable)
      .where(
        and(
          eq(creatorConversationsTable.id, id),
          eq(creatorConversationsTable.userId, userId)
        )
      )
      .limit(1);
    return conversation[0];
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw new Error("Failed to get conversation");
  }
};

export const getConversationsByUserId = async (userId: string): Promise<SelectCreatorConversation[]> => {
  try {
    const conversations = await db
      .select()
      .from(creatorConversationsTable)
      .where(eq(creatorConversationsTable.userId, userId));
    return conversations;
  } catch (error) {
    console.error("Error getting conversations:", error);
    throw new Error("Failed to get conversations");
  }
};

export const updateConversation = async (id: string, userId: string, messages: ChatMessage[]) => {
  try {
    const [updatedConversation] = await db
      .update(creatorConversationsTable)
      .set({ 
        messages: messages,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(creatorConversationsTable.id, id),
          eq(creatorConversationsTable.userId, userId)
        )
      )
      .returning();
    return updatedConversation;
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw new Error("Failed to update conversation");
  }
};

export const deleteConversation = async (id: string, userId: string) => {
  try {
    await db
      .delete(creatorConversationsTable)
      .where(
        and(
          eq(creatorConversationsTable.id, id),
          eq(creatorConversationsTable.userId, userId)
        )
      );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw new Error("Failed to delete conversation");
  }
}; 