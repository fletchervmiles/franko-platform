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

export async function updateChatResponseStatus(
  id: string,
  status: string,
  completionStatus: string
): Promise<SelectChatResponse | undefined> {
  return await updateChatResponse(id, { 
    status,
    completionStatus,
    ...(completionStatus === "completed" ? {
      interviewEndTime: new Date(),
      totalInterviewMinutes: Math.round(
        (new Date().getTime() - (await getChatResponseById(id))?.interviewStartTime?.getTime()!) / 60000
      )
    } : {})
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