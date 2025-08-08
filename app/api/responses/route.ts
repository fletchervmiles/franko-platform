import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { modalsTable } from "@/db/schema/modals-schema";
import { agentsData } from "@/lib/agents-data";
import { eq, and, gte, lte, ilike, desc, count } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 50; // Fixed at 50 per page as requested
    const offset = (page - 1) * limit;

    // Filter parameters
    const agentTypeFilter = url.searchParams.get("agentType");
    const modalNameFilter = url.searchParams.get("modalName");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Build where conditions
    const whereConditions = [
      eq(chatResponsesTable.userId, userId)
    ];

    // Add agent type filter
    if (agentTypeFilter) {
      whereConditions.push(eq(chatInstancesTable.agentType, agentTypeFilter));
    }

    // Add modal name filter
    if (modalNameFilter) {
      whereConditions.push(ilike(modalsTable.name, `%${modalNameFilter}%`));
    }

    // Add date range filters
    if (startDate) {
      // Create start of day in UTC for the given date
      const startOfDay = new Date(startDate + 'T00:00:00.000Z');
      whereConditions.push(gte(chatResponsesTable.interviewEndTime, startOfDay));
    }
    if (endDate) {
      // Create end of day in UTC for the given date
      const endOfDay = new Date(endDate + 'T23:59:59.999Z');
      whereConditions.push(lte(chatResponsesTable.interviewEndTime, endOfDay));
    }

    // Base query with joins
    const query = db
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
      .where(and(...whereConditions));

    // Get total count for pagination (more efficient count query)
    const totalCountQuery = db
      .select({ count: count() })
      .from(chatResponsesTable)
      .leftJoin(chatInstancesTable, eq(chatResponsesTable.chatInstanceId, chatInstancesTable.id))
      .leftJoin(modalsTable, eq(chatInstancesTable.modalId, modalsTable.id))
      .where(and(...whereConditions));

    // Get aggregated statistics for all filtered results
    const aggregatedStatsQuery = db
      .select({
        totalCustomerWords: chatResponsesTable.user_words,
        completionStatus: chatResponsesTable.completionStatus,
      })
      .from(chatResponsesTable)
      .leftJoin(chatInstancesTable, eq(chatResponsesTable.chatInstanceId, chatInstancesTable.id))
      .leftJoin(modalsTable, eq(chatInstancesTable.modalId, modalsTable.id))
      .where(and(...whereConditions));

    // Execute queries
    const [responses, totalCountResult, allFilteredResults] = await Promise.all([
      query
        .orderBy(desc(chatResponsesTable.interviewEndTime))
        .limit(limit)
        .offset(offset),
      totalCountQuery,
      aggregatedStatsQuery
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate aggregated statistics across all filtered results
    const totalCustomerWords = allFilteredResults.reduce((sum, result) => {
      return sum + parseInt(result.totalCustomerWords || '0', 10);
    }, 0);

    const avgCompletionRate = allFilteredResults.length > 0 
      ? allFilteredResults.reduce((sum, result) => {
          const rate = result.completionStatus 
            ? parseInt(result.completionStatus.replace('%', ''), 10) 
            : 0;
          return sum + rate;
        }, 0) / allFilteredResults.length
      : 0;

    // Transform responses to include agent names
    const transformedResponses = responses.map(response => {
      // Find agent data by ID
      const agentData = agentsData.find(agent => agent.id === response.agentType);
      
      return {
        ...response,
        agentName: agentData?.name || response.agentType || 'Unknown Agent',
        // Format name
        name: response.intervieweeFirstName && response.intervieweeSecondName 
          ? `${response.intervieweeFirstName} ${response.intervieweeSecondName}`
          : response.intervieweeFirstName || 'Anonymous',
        // Format completion rate
        completionRate: response.completionStatus 
          ? parseInt(response.completionStatus.replace('%', ''), 10) 
          : 0,
        // Format completion date
        completionDate: response.interviewEndTime 
          ? response.interviewEndTime.toISOString().split('T')[0]
          : response.updatedAt.toISOString().split('T')[0],
        // Format customer words
        customerWords: parseInt(response.user_words || '0', 10),
        // Format summary and transcript
        summary: response.transcript_summary || '',
        transcript: response.cleanTranscript || '',
        email: response.intervieweeEmail || 'No email provided',
      };
    });

    return NextResponse.json({
      responses: transformedResponses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      aggregatedStats: {
        totalResponses: totalCount,
        totalCustomerWords,
        avgCompletionRate,
      },
      filters: {
        agentType: agentTypeFilter,
        modalName: modalNameFilter,
        startDate,
        endDate,
      }
    });

  } catch (error) {
    console.error("Failed to fetch aggregated responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}