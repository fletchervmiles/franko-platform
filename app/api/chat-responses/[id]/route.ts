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
import { getChatResponseUserInfoById } from "@/db/queries/chat-responses-queries";
import { safeAuth } from "@/lib/utils/safe-auth";

/**
 * GET handler for retrieving a chat response by ID
 * Returns only essential user information for improved performance
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
    // Use safeAuth instead of auth() to handle excluded routes
    await safeAuth();
    
    const chatResponseId = params.id;

    if (!chatResponseId) {
      return new NextResponse("Missing chat response ID", { status: 400 });
    }

    // Cache headers for better client-side caching
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
    
    // Use the optimized query that only fetches the fields we need
    const userData = await getChatResponseUserInfoById(chatResponseId);

    if (!userData) {
      return new NextResponse("Chat response not found", { status: 404 });
    }

    // Return minimal user data to improve response time
    return NextResponse.json(userData, { headers });
  } catch (error) {
    console.error("Failed to retrieve chat response:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}