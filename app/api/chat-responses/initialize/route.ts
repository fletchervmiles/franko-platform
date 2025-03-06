/**
 * Chat Response Initialization API Route
 * 
 * OVERVIEW:
 * This API endpoint is responsible for initializing a new chat response record
 * when a user starts an external chat session. It serves as the bridge between
 * the user-facing start page and the active chat interface, creating the necessary
 * database records and returning the identifiers required for the active chat page.
 * 
 * FLOW:
 * 1. Receives a chatInstanceId from the client
 * 2. Validates the chat instance exists in the database
 * 3. Retrieves organization details from the profile associated with the chat instance
 * 4. Creates a new chat response record with "active" status
 * 5. Returns both IDs and organization details needed for the chat interface
 * 
 * USED BY:
 * - The start page (/chat/external/[id]/start) when a user clicks to begin an interview
 * - Called before redirecting to the active chat interface
 * 
 * DEPENDENCIES:
 * - Database queries for chat instances, profiles, and chat responses
 * - Next.js Response handling
 */

import { NextResponse } from "next/server";
import { db } from "../../../../db/db";
import { chatResponsesTable } from "../../../../db/schema/chat-responses-schema";
import { chatInstancesTable } from "../../../../db/schema/chat-instances-schema";
import { generateUUID } from "../../../../lib/utils";
import { eq } from "drizzle-orm";

/**
 * POST handler for chat initialization
 * 
 * @param request - The incoming HTTP request containing chatInstanceId
 * @returns A JSON response with IDs and organization details, or an error response
 */
export async function POST(request: Request) {
  try {
    const { chatInstanceId, intervieweeFirstName, intervieweeSecondName, intervieweeEmail } = await request.json();

    if (!chatInstanceId) {
      return new NextResponse("Missing chatInstanceId", { status: 400 });
    }

    // Performance optimization: Use a single transaction for all database operations
    // This reduces round-trips to the database and improves atomicity
    return await db.transaction(async (tx) => {
      // Get the chat instance to get the userId - Select only the fields we need
      // This reduces data transfer and improves query performance
      const [chatInstance] = await tx
        .select({
          userId: chatInstancesTable.userId,
          objectiveProgress: chatInstancesTable.objectiveProgress
        })
        .from(chatInstancesTable)
        .where(eq(chatInstancesTable.id, chatInstanceId));

      if (!chatInstance) {
        return new NextResponse("Chat instance not found", { status: 404 });
      }

      // Create a new chat response with a single DB operation
      const chatResponseId = generateUUID();
      
      // Using the transaction context for the insert
      const [chatResponse] = await tx
        .insert(chatResponsesTable)
        .values({
          id: chatResponseId,
          userId: chatInstance.userId,
          chatInstanceId,
          status: "active",
          intervieweeFirstName,
          intervieweeSecondName, 
          intervieweeEmail,
          interviewStartTime: new Date(),
          chatProgress: chatInstance.objectiveProgress,
        })
        .returning({ id: chatResponsesTable.id });

      // Return minimal data to improve response time
      return NextResponse.json({ chatResponseId: chatResponse.id });
    });
  } catch (error) {
    console.error("Failed to initialize chat response:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 