/**
 * Conversation Finalization API Endpoint
 * 
 * Handles requests to finalize a conversation:
 * - POST: Triggers the conversation finalizer utility
 * 
 * This endpoint is called when a conversation is complete, either:
 * 1. When the user clicks the "Finish Conversation" button
 * 2. When the UI detects that the conversation is naturally concluding
 * 3. After a period of inactivity
 */

import { NextResponse } from 'next/server';
import { finalizeConversation } from '@/lib/utils/conversation-finalizer'; // Ensure this is the correct path to the updated finalizer
import { logger } from '@/lib/logger';
// Remove the headers import for testing
// import { headers } from 'next/headers'; 

// Comment out potentially problematic imports/variables if they existed previously
// const BACKGROUND_TASK_SECRET = process.env.BACKGROUND_TASK_SECRET;

/**
 * POST Request Handler
 * 
 * Triggers the conversation finalization process:
 * - Reads chatResponseId from the request body.
 * - Calls the finalizeConversation utility (which now handles updates, summary, webhooks, etc.).
 * - Returns a success or error response.
 */
export async function POST(request: Request) {
  logger.info('[API POST /finalize] Handler entered.'); // Log entry
  let chatResponseIdForError: string | undefined = undefined; // For logging in outer catch

  try {
    logger.debug(`[API POST /finalize] Processing request URL: ${request.url}`); // Log URL
    // Read chatResponseId from query parameters instead of body
    const requestUrl = new URL(request.url);
    const chatResponseId = requestUrl.searchParams.get('chatResponseId');
    logger.debug(`[API POST /finalize] Extracted chatResponseId from URL: ${chatResponseId}`); // Log extracted ID
    // Ensure null from searchParams.get becomes undefined for the logging variable
    chatResponseIdForError = chatResponseId === null ? undefined : chatResponseId; 

    // Validate required parameters
    if (!chatResponseId) {
      logger.error('[API POST /finalize] Missing required query parameter: chatResponseId');
      return NextResponse.json({ error: 'Chat response ID is required in query parameters' }, { status: 400 });
    }
    
    logger.info(`[API POST /finalize] Received request to finalize conversation: ${chatResponseId}`);
    
    // Call the finalizer utility
    // This function now handles the DB updates, summary generation, webhook triggers, etc.
    logger.debug(`[API POST /finalize] Calling finalizeConversation for: ${chatResponseId}`); // Log before calling finalizer
    await finalizeConversation(chatResponseId);
    
    logger.info(`[API POST /finalize] Conversation finalization process completed for: ${chatResponseId}`);
    
    // Return success response
    const successResponse = { 
      success: true, 
      message: 'Conversation finalized successfully',
      chatResponseId
    };
    logger.debug('[API POST /finalize] Sending success response:', successResponse); // Log success response object
    return NextResponse.json(successResponse, { status: 200 }); // Use 200 OK for success

  } catch (error) {
    // Log and return any errors from the finalization process
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Try to include chatResponseId in error log if possible 
    // Use the chatResponseIdForError variable captured earlier
    logger.error(`[API POST /finalize] Error during finalization for ${chatResponseIdForError ?? 'unknown'}: ${errorMessage}`);
    
    return NextResponse.json({ 
      error: 'Failed to finalize conversation',
      message: errorMessage
    }, { status: 500 });
  }
} 

// Ensure no GET handler remains in this file. 