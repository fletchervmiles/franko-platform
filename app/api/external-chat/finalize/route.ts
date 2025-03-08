/**
 * API Route for Finalizing External Chat Conversations
 * 
 * This endpoint finalizes a chat conversation by:
 * 1. Updating end time and duration
 * 2. Cleaning the transcript
 * 3. Calculating completion status
 * 4. Counting user words
 * 5. Tracking usage if completion > 50%
 * 6. Generating a summary if completion > 0%
 */

import { NextRequest, NextResponse } from "next/server";
import { finalizeConversation } from "@/lib/utils/conversation-finalizer";
import { z } from "zod";
import { logger } from "@/lib/logger";

// Input validation schema
const FinalizeRequestSchema = z.object({
  chatResponseId: z.string().uuid(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validation = FinalizeRequestSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn('Invalid finalize request:', validation.error.format());
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { chatResponseId } = validation.data;
    
    // Finalize the conversation
    await finalizeConversation(chatResponseId);
    
    // Return success response
    return NextResponse.json(
      { success: true, message: "Conversation finalized successfully" },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error finalizing conversation:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: "Failed to finalize conversation", 
        message: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}