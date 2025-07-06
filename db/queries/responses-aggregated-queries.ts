import { db } from "@/db/db";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { modalsTable } from "@/db/schema/modals-schema";
import { eq, and, gte, lte, ilike, desc, count } from "drizzle-orm";

export interface ResponseFilters {
  userId: string;
  agentType?: string;
  modalName?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface AggregatedResponse {
  id: string;
  intervieweeFirstName: string | null;
  intervieweeSecondName: string | null;
  intervieweeEmail: string | null;
  completionStatus: string | null;
  interviewEndTime: Date | null;
  interviewStartTime: Date | null;
  transcript_summary: string | null;
  cleanTranscript: string | null;
  user_words: string | null;
  updatedAt: Date;
  agentType: string | null;
  chatInstanceId: string | null;
  modalName: string | null;
  modalEmbedSlug: string | null;
}

/**
 * Build where conditions array based on filters
 */
function buildWhereConditions(filters: ResponseFilters) {
  const whereConditions = [
    eq(chatResponsesTable.userId, filters.userId)
  ];

  // Add agent type filter
  if (filters.agentType) {
    whereConditions.push(eq(chatInstancesTable.agentType, filters.agentType));
  }

  // Add modal name filter
  if (filters.modalName) {
    whereConditions.push(ilike(modalsTable.name, `%${filters.modalName}%`));
  }

  // Add date range filters
  if (filters.startDate) {
    whereConditions.push(gte(chatResponsesTable.interviewEndTime, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    whereConditions.push(lte(chatResponsesTable.interviewEndTime, new Date(filters.endDate)));
  }

  return whereConditions;
}

/**
 * Get aggregated responses with pagination and filtering
 */
export async function getAggregatedResponses(
  filters: ResponseFilters,
  pagination: PaginationParams
): Promise<AggregatedResponse[]> {
  const whereConditions = buildWhereConditions(filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const responses = await db
    .select({
      // Chat response fields
      id: chatResponsesTable.id,
      intervieweeFirstName: chatResponsesTable.intervieweeFirstName,
      intervieweeSecondName: chatResponsesTable.intervieweeSecondName,
      intervieweeEmail: chatResponsesTable.intervieweeEmail,
      completionStatus: chatResponsesTable.completionStatus,
      interviewEndTime: chatResponsesTable.interviewEndTime,
      interviewStartTime: chatResponsesTable.interviewStartTime,
      transcript_summary: chatResponsesTable.transcript_summary,
      cleanTranscript: chatResponsesTable.cleanTranscript,
      user_words: chatResponsesTable.user_words,
      updatedAt: chatResponsesTable.updatedAt,
      // Chat instance fields
      agentType: chatInstancesTable.agentType,
      chatInstanceId: chatInstancesTable.id,
      // Modal fields
      modalName: modalsTable.name,
      modalEmbedSlug: modalsTable.embedSlug,
    })
    .from(chatResponsesTable)
    .leftJoin(chatInstancesTable, eq(chatResponsesTable.chatInstanceId, chatInstancesTable.id))
    .leftJoin(modalsTable, eq(chatInstancesTable.modalId, modalsTable.id))
    .where(and(...whereConditions))
    .orderBy(desc(chatResponsesTable.interviewEndTime))
    .limit(pagination.limit)
    .offset(offset);

  return responses;
}

/**
 * Get total count of responses matching filters
 */
export async function getAggregatedResponsesCount(filters: ResponseFilters): Promise<number> {
  const whereConditions = buildWhereConditions(filters);

  const result = await db
    .select({ count: count() })
    .from(chatResponsesTable)
    .leftJoin(chatInstancesTable, eq(chatResponsesTable.chatInstanceId, chatInstancesTable.id))
    .leftJoin(modalsTable, eq(chatInstancesTable.modalId, modalsTable.id))
    .where(and(...whereConditions));

  return result[0]?.count || 0;
}

/**
 * Get all responses for download (no pagination)
 */
export async function getAllAggregatedResponses(filters: ResponseFilters): Promise<AggregatedResponse[]> {
  const whereConditions = buildWhereConditions(filters);

  const responses = await db
    .select({
      // Chat response fields
      id: chatResponsesTable.id,
      intervieweeFirstName: chatResponsesTable.intervieweeFirstName,
      intervieweeSecondName: chatResponsesTable.intervieweeSecondName,
      intervieweeEmail: chatResponsesTable.intervieweeEmail,
      completionStatus: chatResponsesTable.completionStatus,
      interviewEndTime: chatResponsesTable.interviewEndTime,
      interviewStartTime: chatResponsesTable.interviewStartTime,
      transcript_summary: chatResponsesTable.transcript_summary,
      cleanTranscript: chatResponsesTable.cleanTranscript,
      user_words: chatResponsesTable.user_words,
      updatedAt: chatResponsesTable.updatedAt,
      // Chat instance fields
      agentType: chatInstancesTable.agentType,
      chatInstanceId: chatInstancesTable.id,
      // Modal fields
      modalName: modalsTable.name,
      modalEmbedSlug: modalsTable.embedSlug,
    })
    .from(chatResponsesTable)
    .leftJoin(chatInstancesTable, eq(chatResponsesTable.chatInstanceId, chatInstancesTable.id))
    .leftJoin(modalsTable, eq(chatInstancesTable.modalId, modalsTable.id))
    .where(and(...whereConditions))
    .orderBy(desc(chatResponsesTable.interviewEndTime));

  return responses;
} 