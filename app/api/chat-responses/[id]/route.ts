/**
 * Chat Response API Route
 * 
 * OVERVIEW:
 * This API endpoint retrieves a chat response by ID. It's used to get
 * information about a specific chat response, including user information.
 * 
 * FLOW:
 * 1. Extracts the chat response ID from the URL parameters
 * 2. Retrieves the chat response from the database
 * 3. Returns the chat response data or an error if not found
 * 
 * USED BY:
 * - The ExternalChat component to get user information for customizing messages
 * 
 * DEPENDENCIES:
 * - Database queries for chat responses
 * - Next.js Response handling
 */

import { NextResponse } from "next/server";
import { getChatResponseById } from "@/db/queries/chat-responses-queries";

/**
 * GET handler for retrieving a chat response by ID
 * 
 * @param request - The incoming HTTP request
 * @param params - URL parameters containing the chat response ID
 * @returns A JSON response with the chat response data, or an error response
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chatResponseId = params.id;

    if (!chatResponseId) {
      return new NextResponse("Missing chat response ID", { status: 400 });
    }

    const chatResponse = await getChatResponseById(chatResponseId);

    if (!chatResponse) {
      return new NextResponse("Chat response not found", { status: 404 });
    }

    // Return the chat response data without sensitive information
    return NextResponse.json({
      id: chatResponse.id,
      chatInstanceId: chatResponse.chatInstanceId,
      status: chatResponse.status,
      intervieweeFirstName: chatResponse.intervieweeFirstName,
      intervieweeEmail: chatResponse.intervieweeEmail,
      interviewStartTime: chatResponse.interviewStartTime,
      interviewEndTime: chatResponse.interviewEndTime,
    });
  } catch (error) {
    console.error("Failed to retrieve chat response:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 