/**
 * Consolidated Chat Initialization API Route
 * 
 * OVERVIEW:
 * This API endpoint consolidates two operations into a single request:
 * 1. Fetching chat instance data
 * 2. Creating a new chat response record
 * 
 * This reduces network round trips by eliminating the need for separate 
 * API calls during the initialization process.
 * 
 * FLOW:
 * 1. Receives a chatInstanceId and optional user data
 * 2. Validates and retrieves the chat instance in a single transaction
 * 3. Checks if user has exceeded their total responses quota
 * 4. Creates a new chat response record in the same transaction
 * 5. Returns all necessary data for initialization in a single response
 * 
 * BENEFITS:
 * - Single network round trip instead of multiple requests
 * - Atomic database operation ensures data consistency
 * - Reduced client-side complexity
 */

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { generateUUID } from "@/lib/utils";
import { eq, count } from "drizzle-orm";
import { getProfileByUserId } from "@/db/queries/profiles-queries";

export async function POST(request: Request) {
  try {
    const { chatInstanceId, intervieweeFirstName, intervieweeSecondName, intervieweeEmail } = await request.json();

    if (!chatInstanceId) {
      return new NextResponse("Missing chatInstanceId", { status: 400 });
    }

    // Use a single transaction for the entire initialization process
    // This ensures atomicity and reduces database round trips
    return await db.transaction(async (tx) => {
      // Get the chat instance with all necessary fields
      const [chatInstance] = await tx
        .select()
        .from(chatInstancesTable)
        .where(eq(chatInstancesTable.id, chatInstanceId));

      if (!chatInstance) {
        return new NextResponse("Chat instance not found", { status: 404 });
      }

      // Check if the user has reached their total responses quota
      const profile = await getProfileByUserId(chatInstance.userId);
      if (!profile) {
        return new NextResponse("User profile not found", { status: 404 });
      }

      // If the user has exceeded their quota, prevent creating a new response
      if ((profile.totalResponsesUsed || 0) >= (profile.totalResponsesQuota || 0)) {
        return new NextResponse(
          "Response limit reached. This conversation is no longer accepting new submissions.",
          { status: 403 }
        );
      }

      // Create a new chat response
      const chatResponseId = generateUUID();
      
      // Include all necessary fields for compatibility with existing system
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
          // Ensure we have an empty messages array that can be updated
          messagesJson: "[]",
        })
        .returning();

      console.log("Created new chat response:", chatResponseId);

      // Return all data needed for initialization in a single response
      return NextResponse.json({
        chatInstanceData: {
          welcomeDescription: chatInstance.welcomeDescription,
          respondentContacts: chatInstance.respondentContacts
        },
        chatResponseId: chatResponse.id
      });
    });
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}