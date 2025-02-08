/**
 * Database Queries Module
 * 
 * Purpose:
 * - Centralizes database operations for chat instances
 * - Provides type-safe query functions for data access
 * - Manages chat history
 */

import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatInstancesTable, type SelectChatInstance } from "../schema/chat-instances-schema";

// Chat Management Functions

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any[];
  userId: string;
}) {
  try {
    const selectedChats = await db
      .select()
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chatInstancesTable)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chatInstancesTable.id, id))
        .returning();
    }

    return await db
      .insert(chatInstancesTable)
      .values({
        id,
        messages: JSON.stringify(messages),
        userId,
      })
      .returning();
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db
      .delete(chatInstancesTable)
      .where(eq(chatInstancesTable.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }): Promise<SelectChatInstance[]> {
  try {
    const chats = await db
      .select()
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.userId, id))
      .orderBy(desc(chatInstancesTable.createdAt));
      
    return chats.map(chat => ({
      ...chat,
      messages: chat.messages ? JSON.parse(chat.messages) : []
    }));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }): Promise<SelectChatInstance> {
  try {
    const [selectedChat] = await db
      .select()
      .from(chatInstancesTable)
      .where(eq(chatInstancesTable.id, id));

    if (!selectedChat) {
      throw new Error('Chat not found');
    }

    return {
      ...selectedChat,
      messages: selectedChat.messages ? JSON.parse(selectedChat.messages) : []
    };
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}
