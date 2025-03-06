import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { chatResponsesTable, type InsertChatResponse, type SelectChatResponse } from "@/db/schema/chat-responses-schema";

export async function createChatResponse(data: InsertChatResponse): Promise<SelectChatResponse> {
  const [chatResponse] = await db
    .insert(chatResponsesTable)
    .values(data)
    .returning();
  return chatResponse;
}

export async function getChatResponseById(id: string): Promise<SelectChatResponse | undefined> {
  const [chatResponse] = await db
    .select()
    .from(chatResponsesTable)
    .where(eq(chatResponsesTable.id, id));
  return chatResponse;
}

/**
 * Gets only essential user information from a chat response
 * This is an optimized version that only fetches the fields needed for personalization
 */
export async function getChatResponseUserInfoById(id: string): Promise<{
  intervieweeFirstName?: string;
  intervieweeEmail?: string;
} | undefined> {
  const [chatResponse] = await db
    .select({
      intervieweeFirstName: chatResponsesTable.intervieweeFirstName,
      intervieweeEmail: chatResponsesTable.intervieweeEmail
    })
    .from(chatResponsesTable)
    .where(eq(chatResponsesTable.id, id));
  return chatResponse;
}

export async function getChatResponsesByUserId(userId: string): Promise<SelectChatResponse[]> {
  return await db
    .select()
    .from(chatResponsesTable)
    .where(eq(chatResponsesTable.userId, userId))
    .orderBy(desc(chatResponsesTable.createdAt));
}

export async function getChatResponsesByChatInstanceId(chatInstanceId: string): Promise<SelectChatResponse[]> {
  return await db
    .select()
    .from(chatResponsesTable)
    .where(eq(chatResponsesTable.chatInstanceId, chatInstanceId));
}

export async function updateChatResponse(
  id: string,
  data: Partial<InsertChatResponse>
): Promise<SelectChatResponse | undefined> {
  const [updatedChatResponse] = await db
    .update(chatResponsesTable)
    .set(data)
    .where(eq(chatResponsesTable.id, id))
    .returning();
  return updatedChatResponse;
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
        // Only fetch the start time if it wasn't provided
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
    
    // Update the record
    const [updatedChatResponse] = await tx
      .update(chatResponsesTable)
      .set(updates)
      .where(eq(chatResponsesTable.id, id))
      .returning();
    
    return updatedChatResponse;
  });
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
  await db
    .delete(chatResponsesTable)
    .where(eq(chatResponsesTable.id, id));
}

export async function updateChatResponseTranscript(
  id: string,
  cleanTranscript: string,
  messagesJson: string
): Promise<SelectChatResponse | undefined> {
  const [updatedChatResponse] = await db
    .update(chatResponsesTable)
    .set({ cleanTranscript, messagesJson })
    .where(eq(chatResponsesTable.id, id))
    .returning();
  return updatedChatResponse;
}

export async function updateChatResponseInterviewTimes(
  id: string,
  interviewStartTime: Date,
  interviewEndTime: Date,
  totalInterviewMinutes: number
): Promise<SelectChatResponse | undefined> {
  const [updatedChatResponse] = await db
    .update(chatResponsesTable)
    .set({ 
      interviewStartTime, 
      interviewEndTime,
      totalInterviewMinutes
    })
    .where(eq(chatResponsesTable.id, id))
    .returning();
  return updatedChatResponse;
}