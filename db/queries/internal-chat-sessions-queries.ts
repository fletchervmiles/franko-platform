import { db } from "@/db/db";
import { internalChatSessionsTable } from "@/db/schema/internal-chat-sessions-schema";
import { eq, desc } from "drizzle-orm";
import { generateUUID } from "@/lib/utils";
import { LRUCache } from "lru-cache";
import { logger } from "@/lib/logger";

// Cache for internal chat sessions to improve performance
const internalChatSessionCache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Create a new internal chat session
export async function createInternalChatSession({
  userId,
  title,
  selectedResponses,
  contextData,
}: {
  userId: string;
  title: string;
  selectedResponses: string[];
  contextData?: string;
}) {
  try {
    const id = generateUUID();
    
    await db.insert(internalChatSessionsTable).values({
      id,
      userId,
      title,
      selectedResponses: JSON.stringify(selectedResponses),
      messagesJson: JSON.stringify([]),
      contextData
    });
    
    const session = await getInternalChatSessionById(id);
    return session;
  } catch (error) {
    logger.error("Error creating internal chat session", { error });
    throw error;
  }
}

// Get an internal chat session by ID
export async function getInternalChatSessionById(id: string) {
  const cacheKey = `internal-chat-session:${id}`;
  
  // Check cache first
  const cachedSession = internalChatSessionCache.get(cacheKey);
  if (cachedSession) {
    logger.debug("Internal chat session cache hit", { id });
    return cachedSession;
  }
  
  try {
    const [session] = await db
      .select()
      .from(internalChatSessionsTable)
      .where(eq(internalChatSessionsTable.id, id));
    
    if (session) {
      // Cache the session
      internalChatSessionCache.set(cacheKey, session);
    }
    
    return session;
  } catch (error) {
    logger.error("Error getting internal chat session by ID", { error, id });
    throw error;
  }
}

// Get all internal chat sessions for a user
export async function getInternalChatSessionsByUserId(userId: string) {
  try {
    const sessions = await db
      .select()
      .from(internalChatSessionsTable)
      .where(eq(internalChatSessionsTable.userId, userId))
      .orderBy(desc(internalChatSessionsTable.updatedAt));
    
    return sessions;
  } catch (error) {
    logger.error("Error getting internal chat sessions by user ID", { error, userId });
    throw error;
  }
}

// Update an internal chat session
export async function updateInternalChatSession(
  id: string,
  data: Partial<{
    title: string;
    messagesJson: string;
    selectedResponses: string;
    contextData: string;
  }>
) {
  try {
    await db
      .update(internalChatSessionsTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(internalChatSessionsTable.id, id));
    
    // Invalidate cache
    internalChatSessionCache.delete(`internal-chat-session:${id}`);
    
    return await getInternalChatSessionById(id);
  } catch (error) {
    logger.error("Error updating internal chat session", { error, id });
    throw error;
  }
}

// Delete an internal chat session
export async function deleteInternalChatSession(id: string) {
  try {
    await db
      .delete(internalChatSessionsTable)
      .where(eq(internalChatSessionsTable.id, id));
    
    // Invalidate cache
    internalChatSessionCache.delete(`internal-chat-session:${id}`);
    
    return true;
  } catch (error) {
    logger.error("Error deleting internal chat session", { error, id });
    throw error;
  }
}