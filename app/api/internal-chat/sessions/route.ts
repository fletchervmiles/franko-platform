/**
 * Internal Chat Sessions API Route
 * 
 * This endpoint handles fetching a user's internal chat sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getInternalChatSessionsByUserId } from "@/db/queries/internal-chat-sessions-queries";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      logger.error("Unauthorized access attempt to fetch internal chat sessions");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all sessions for this user
    const sessions = await getInternalChatSessionsByUserId(userId);

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching internal chat sessions", { error: errorMessage });
    
    return NextResponse.json(
      { error: "Failed to fetch internal chat sessions", message: errorMessage },
      { status: 500 }
    );
  }
}