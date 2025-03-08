/**
 * Chat Responses API Route
 * 
 * OVERVIEW:
 * This API endpoint retrieves all chat responses associated with a chat instance.
 * It's used by the conversation page to display finalized conversation details.
 * 
 * FLOW:
 * 1. Extracts the chat instance ID from the URL parameters
 * 2. Authenticates the user with Clerk
 * 3. Retrieves the chat responses from the database
 * 4. Returns the chat responses data or an error if not found
 * 
 * USED BY:
 * - The conversation-page-client component to display response data
 * 
 * DEPENDENCIES:
 * - Database queries for chat responses
 * - Clerk authentication
 * - Next.js Response handling
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { logger } from "@/lib/logger";

/**
 * GET handler for retrieving chat responses by chat instance ID
 * 
 * @param request - The incoming HTTP request
 * @param params - URL parameters containing the chat instance ID
 * @returns A JSON response with the chat responses data, or an error response
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chatInstanceId = params.id;

    if (!chatInstanceId) {
      return new NextResponse("Missing chat instance ID", { status: 400 });
    }

    // Cache headers for better client-side caching
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
    
    // Get all responses for the chat instance
    const responses = await db
      .select()
      .from(chatResponsesTable)
      .where(eq(chatResponsesTable.chatInstanceId, chatInstanceId))
      .orderBy(chatResponsesTable.createdAt);

    // Filter to only include responses that have a status of 'completed'
    const completedResponses = responses.filter(
      response => response.status === 'completed'
    );

    logger.info('Chat responses fetched', { 
      chatInstanceId, 
      count: completedResponses.length 
    });

    return NextResponse.json({ responses: completedResponses }, { headers });
  } catch (error) {
    logger.error("Failed to retrieve chat responses:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}