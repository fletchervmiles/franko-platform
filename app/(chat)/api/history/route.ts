/**
 * Chat History API Route
 * 
 * This endpoint handles fetching a user's chat history.
 * It's called by the History component using SWR for:
 * - Initial history load
 * - Real-time updates
 * - After chat deletions
 */

import { auth } from "@clerk/nextjs/server";  // Authentication utilities
import { getChatsByUserId } from "@/db/queries/queries";  // Database query

/**
 * GET Request Handler
 * 
 * Data Flow:
 * 1. Check authentication
 * 2. Get user ID from session
 * 3. Fetch chats from database
 * 4. Return JSON response
 * 
 * Used by:
 * - components/custom/history.tsx
 * - Fetched via SWR with automatic revalidation
 */
export async function GET() {
  // Verify user is authenticated
  const { userId } = await auth();

  // Return 401 if no valid session
  if (!userId) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  // Fetch all chats for the authenticated user
  const chats = await getChatsByUserId({ id: userId });
  
  // Return chats as JSON response
  return Response.json(chats);
}

/**
 * Integration Points:
 * 
 * 1. History Component:
 *    - Fetches data using SWR
 *    - Displays chat list
 * 
 * 2. Database:
 *    - getChatsByUserId queries user's chats
 * 
 * 3. Authentication:
 *    - Ensures only authenticated users can fetch
 *    - Provides user ID for database query
 */
