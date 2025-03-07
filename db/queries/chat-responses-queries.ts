import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { chatResponsesTable, type InsertChatResponse, type SelectChatResponse } from "@/db/schema/chat-responses-schema";
import { LRUCache } from 'lru-cache';

// Cache for chat responses to reduce database load
const responseCache = new LRUCache<string, SelectChatResponse>({
  max: 100,                 // Store up to 100 chat responses
  ttl: 1000 * 30,           // Cache for 30 seconds
  updateAgeOnGet: true,     // Extend TTL when accessed
  allowStale: true          // Allow serving stale data briefly while refreshing
});

export async function createChatResponse(data: InsertChatResponse): Promise<SelectChatResponse> {
  try {
    const [chatResponse] = await db
      .insert(chatResponsesTable)
      .values(data)
      .returning();
    
    // Cache the new response
    responseCache.set(chatResponse.id, chatResponse);
    
    return chatResponse;
  } catch (error) {
    console.error("Error creating chat response:", error);
    throw new Error("Failed to create chat response");
  }
}

export async function getChatResponseById(id: string): Promise<SelectChatResponse | undefined> {
  try {
    // Check cache first
    const cachedResponse = responseCache.get(id);
    if (cachedResponse) {
      console.log(`CACHE HIT: Using cached chat response for ${id}`);
      return cachedResponse;
    }
    
    console.log(`CACHE MISS: Fetching chat response ${id} from database`);
    
    // Not in cache, fetch from database
    const [chatResponse] = await db
      .select()
      .from(chatResponsesTable)
      .where(eq(chatResponsesTable.id, id));
      
    // Store in cache if found
    if (chatResponse) {
      responseCache.set(id, chatResponse);
    }
    
    return chatResponse;
  } catch (error) {
    console.error("Error getting chat response by ID:", error);
    throw new Error("Failed to get chat response");
  }
}

/**
 * Gets only essential user information from a chat response
 * This is an optimized version that only fetches the fields needed for personalization
 */
export async function getChatResponseUserInfoById(id: string): Promise<{
  intervieweeFirstName?: string;
  intervieweeEmail?: string;
} | undefined> {
  try {
    // Check if we have the full response in cache first
    const cachedResponse = responseCache.get(id);
    if (cachedResponse) {
      console.log(`CACHE HIT: Using user info from cached response for ${id}`);
      return {
        intervieweeFirstName: cachedResponse.intervieweeFirstName || undefined,
        intervieweeEmail: cachedResponse.intervieweeEmail || undefined
      };
    }
    
    // Only fetch the specific fields we need
    const [chatResponse] = await db
      .select({
        intervieweeFirstName: chatResponsesTable.intervieweeFirstName,
        intervieweeEmail: chatResponsesTable.intervieweeEmail
      })
      .from(chatResponsesTable)
      .where(eq(chatResponsesTable.id, id));
      
    // Convert null values to undefined
    return chatResponse ? {
      intervieweeFirstName: chatResponse.intervieweeFirstName || undefined,
      intervieweeEmail: chatResponse.intervieweeEmail || undefined
    } : undefined;
  } catch (error) {
    console.error("Error getting chat response user info:", error);
    throw new Error("Failed to get chat response user info");
  }
}

export async function getChatResponsesByUserId(userId: string): Promise<SelectChatResponse[]> {
  try {
    return await db
      .select()
      .from(chatResponsesTable)
      .where(eq(chatResponsesTable.userId, userId))
      .orderBy(desc(chatResponsesTable.createdAt));
  } catch (error) {
    console.error("Error getting chat responses by user ID:", error);
    throw new Error("Failed to get chat responses by user ID");
  }
}

export async function getChatResponsesByChatInstanceId(chatInstanceId: string): Promise<SelectChatResponse[]> {
  try {
    return await db
      .select()
      .from(chatResponsesTable)
      .where(eq(chatResponsesTable.chatInstanceId, chatInstanceId));
  } catch (error) {
    console.error("Error getting chat responses by chat instance ID:", error);
    throw new Error("Failed to get chat responses by chat instance ID");
  }
}

export async function updateChatResponse(
  id: string,
  data: Partial<InsertChatResponse>
): Promise<SelectChatResponse | undefined> {
  try {
    const [updatedChatResponse] = await db
      .update(chatResponsesTable)
      .set(data)
      .where(eq(chatResponsesTable.id, id))
      .returning();
    
    // Update cache with the updated response
    if (updatedChatResponse) {
      responseCache.set(id, updatedChatResponse);
    }
    
    return updatedChatResponse;
  } catch (error) {
    console.error("Error updating chat response:", error);
    throw new Error("Failed to update chat response");
  }
}

export async function updateChatResponseMessages(
  id: string,
  messages: string
): Promise<SelectChatResponse | undefined> {
  return await updateChatResponse(id, { messagesJson: messages });
}

/**
 * Updates the status of a chat response.
 * Optimized to avoid unnecessary database queries when calculating interview duration.
 * 
 * @param id The ID of the chat response
 * @param status The new status
 * @param completionStatus The new completion status
 * @param interviewStartTime Optional start time to avoid an extra database query
 * @returns The updated chat response
 */
export async function updateChatResponseStatus(
  id: string,
  status: string,
  completionStatus: string,
  interviewStartTime?: Date
): Promise<SelectChatResponse | undefined> {
  try {
    // Use a transaction to ensure data consistency and reduce roundtrips
    return await db.transaction(async (tx) => {
      const updates: Partial<InsertChatResponse> = { 
        status,
        completionStatus
      };
      
      if (completionStatus === "completed") {
        const now = new Date();
        updates.interviewEndTime = now;
        
        if (interviewStartTime) {
          // Use provided start time instead of making a database query
          updates.totalInterviewMinutes = Math.round((now.getTime() - interviewStartTime.getTime()) / 60000);
        } else {
          // Check if we have the chat response in cache first
          const cachedResponse = responseCache.get(id);
          if (cachedResponse?.interviewStartTime) {
            updates.totalInterviewMinutes = Math.round(
              (now.getTime() - cachedResponse.interviewStartTime.getTime()) / 60000
            );
          } else {
            // Only fetch the start time if it wasn't provided and not in cache
            const [chatResponse] = await tx
              .select({ interviewStartTime: chatResponsesTable.interviewStartTime })
              .from(chatResponsesTable)
              .where(eq(chatResponsesTable.id, id))
              .limit(1);
            
            if (chatResponse?.interviewStartTime) {
              updates.totalInterviewMinutes = Math.round(
                (now.getTime() - chatResponse.interviewStartTime.getTime()) / 60000
              );
            }
          }
        }
      }
      
      // Update the record
      const [updatedChatResponse] = await tx
        .update(chatResponsesTable)
        .set(updates)
        .where(eq(chatResponsesTable.id, id))
        .returning();
      
      // Update the cache
      if (updatedChatResponse) {
        responseCache.set(id, updatedChatResponse);
      }
      
      return updatedChatResponse;
    });
  } catch (error) {
    console.error("Error updating chat response status:", error);
    throw new Error("Failed to update chat response status");
  }
}

export async function updateChatResponseIntervieweeDetails(
  id: string,
  firstName: string,
  secondName: string,
  email: string
): Promise<SelectChatResponse | undefined> {
  return await updateChatResponse(id, {
    intervieweeFirstName: firstName,
    intervieweeSecondName: secondName,
    intervieweeEmail: email,
    interviewStartTime: new Date()
  });
}

export async function deleteChatResponse(id: string): Promise<void> {
  try {
    await db
      .delete(chatResponsesTable)
      .where(eq(chatResponsesTable.id, id));
    
    // Remove from cache
    responseCache.delete(id);
  } catch (error) {
    console.error("Error deleting chat response:", error);
    throw new Error("Failed to delete chat response");
  }
}

export async function updateChatResponseTranscript(
  id: string,
  cleanTranscript: string,
  messagesJson: string
): Promise<SelectChatResponse | undefined> {
  try {
    const [updatedChatResponse] = await db
      .update(chatResponsesTable)
      .set({ cleanTranscript, messagesJson })
      .where(eq(chatResponsesTable.id, id))
      .returning();
      
    // Update cache
    if (updatedChatResponse) {
      responseCache.set(id, updatedChatResponse);
    }
    
    return updatedChatResponse;
  } catch (error) {
    console.error("Error updating chat response transcript:", error);
    throw new Error("Failed to update chat response transcript");
  }
}

export async function updateChatResponseInterviewTimes(
  id: string,
  interviewStartTime: Date,
  interviewEndTime: Date,
  totalInterviewMinutes: number
): Promise<SelectChatResponse | undefined> {
  return await updateChatResponse(id, { 
    interviewStartTime, 
    interviewEndTime,
    totalInterviewMinutes
  });
}