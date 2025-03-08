/**
 * Internal Chat Session API Route
 * 
 * This endpoint handles fetching a specific internal chat session.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getInternalChatSessionById } from "@/db/queries/internal-chat-sessions-queries";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      logger.error("Unauthorized access attempt to fetch internal chat session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // Get the session
    const session = await getInternalChatSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify the user owns this session
    if (session.userId !== userId) {
      logger.error("User attempted to access another user's internal chat session", {
        requesterId: userId,
        sessionUserId: session.userId,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching internal chat session", { error: errorMessage });
    
    return NextResponse.json(
      { error: "Failed to fetch internal chat session", message: errorMessage },
      { status: 500 }
    );
  }
}