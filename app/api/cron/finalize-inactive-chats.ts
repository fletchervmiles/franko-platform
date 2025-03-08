/**
 * API Route for Automatically Finalizing Inactive Chat Conversations
 * 
 * This endpoint:
 * 1. Finds chat responses that have been inactive for more than 30 minutes
 * 2. Finalizes each inactive conversation
 * 3. Handles pagination for processing large numbers of conversations
 * 
 * Designed to be called by a cron job or scheduler
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { and, eq, isNull, lt, ne } from "drizzle-orm";
import { finalizeConversation } from "@/lib/utils/conversation-finalizer";
import { logger } from "@/lib/logger";

// API key for authentication
const API_KEY = process.env.CRON_API_KEY || '';

// Number of conversations to process per batch
const BATCH_SIZE = 10;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!API_KEY || !authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the page parameter
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * BATCH_SIZE;
    
    // Calculate the cutoff time (30 minutes ago)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);
    
    logger.info('Finding inactive chats before:', { cutoffTime, page, batchSize: BATCH_SIZE });
    
    // Find chat responses that:
    // 1. Don't have a status of 'completed'
    // 2. Don't have an interviewEndTime
    // 3. Were last updated more than 30 minutes ago
    const inactiveResponses = await db.select({
      id: chatResponsesTable.id
    })
    .from(chatResponsesTable)
    .where(
      and(
        ne(chatResponsesTable.status, 'completed'),
        isNull(chatResponsesTable.interviewEndTime),
        lt(chatResponsesTable.updatedAt, cutoffTime)
      )
    )
    .limit(BATCH_SIZE)
    .offset(offset);
    
    logger.info('Found inactive chats:', { count: inactiveResponses.length });
    
    // Process each inactive chat response
    const results = [];
    for (const response of inactiveResponses) {
      try {
        logger.debug('Finalizing inactive chat:', { chatResponseId: response.id });
        await finalizeConversation(response.id);
        results.push({ id: response.id, status: 'success' });
      } catch (error) {
        logger.error('Failed to finalize inactive chat:', { chatResponseId: response.id, error });
        results.push({ 
          id: response.id, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check if there might be more responses to process
    const hasMore = inactiveResponses.length === BATCH_SIZE;
    
    // Return the results
    return NextResponse.json({
      success: true,
      processed: inactiveResponses.length,
      results,
      pagination: {
        page,
        batchSize: BATCH_SIZE,
        hasMore
      }
    });
  } catch (error) {
    logger.error('Error processing inactive chats:', error);
    
    return NextResponse.json(
      { 
        error: "Failed to process inactive chats", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}