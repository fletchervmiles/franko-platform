import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { chatResponsesTable, type InsertChatResponse, type SelectChatResponse } from "../schema";

export async function createChatResponse(chatResponse: InsertChatResponse): Promise<SelectChatResponse> {
  const [newChatResponse] = await db
    .insert(chatResponsesTable)
    .values(chatResponse)
    .returning();
  return newChatResponse;
}

export async function getChatResponseById(id: string): Promise<SelectChatResponse | undefined> {
  const [chatResponse] = await db
    .select()
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
    .where(eq(chatResponsesTable.chatInstanceId, chatInstanceId))
    .orderBy(desc(chatResponsesTable.createdAt));
}

export async function updateChatResponse(
  id: string,
  updates: Partial<InsertChatResponse>
): Promise<SelectChatResponse | undefined> {
  const [updatedChatResponse] = await db
    .update(chatResponsesTable)
    .set(updates)
    .where(eq(chatResponsesTable.id, id))
    .returning();
  return updatedChatResponse;
}

export async function deleteChatResponse(id: string): Promise<void> {
  await db
    .delete(chatResponsesTable)
    .where(eq(chatResponsesTable.id, id));
}

export async function updateChatResponseStatus(
  id: string,
  status: string,
  completionStatus: string
): Promise<SelectChatResponse | undefined> {
  const [updatedChatResponse] = await db
    .update(chatResponsesTable)
    .set({ status, completionStatus })
    .where(eq(chatResponsesTable.id, id))
    .returning();
  return updatedChatResponse;
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

export async function updateChatResponseInterviewee(
  id: string,
  intervieweeFirstName: string,
  intervieweeSecondName: string,
  intervieweeEmail: string
): Promise<SelectChatResponse | undefined> {
  const [updatedChatResponse] = await db
    .update(chatResponsesTable)
    .set({ 
      intervieweeFirstName,
      intervieweeSecondName,
      intervieweeEmail
    })
    .where(eq(chatResponsesTable.id, id))
    .returning();
  return updatedChatResponse;
} 