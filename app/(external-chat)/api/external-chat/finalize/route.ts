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
// finalizeConversation is called by the background task, not directly here anymore
// import { finalizeConversation } from '@/lib/utils/conversation-finalizer'; 
import { logger } from '@/lib/logger';
// Remove the headers import for testing
// import { headers } from 'next/headers'; 

// Comment out potentially problematic imports/variables if they existed previously
// const BACKGROUND_TASK_SECRET = process.env.BACKGROUND_TASK_SECRET;

/**
 * GET Request Handler
 * 
 * Triggers the conversation finalization process:
 * - Updates end time and duration
 * - Calculates completion status
 * - Generates transcript and summary
 * - Sends notifications
 */
export async function GET(request: Request) {
  try {
    logger.debug('[API GET /finalize] Minimal handler entered.');

    // --- Temporarily Commented Out Logic ---
    
    // 1. Read chatResponseId from query parameters
    const requestUrl = new URL(request.url);
    const chatResponseId = requestUrl.searchParams.get('chatResponseId');

    if (!chatResponseId) {
      logger.error('[API GET /finalize] Missing required query parameter: chatResponseId');
      return NextResponse.json({ error: 'Chat response ID is required in query parameters' }, { status: 400 });
    }

    /* // Keep this block commented
    // Accessing env var might be an issue?
    const BACKGROUND_TASK_SECRET = process.env.BACKGROUND_TASK_SECRET;

    // --- Trigger Background Task (Fire-and-Forget) ---
    if (!BACKGROUND_TASK_SECRET) {
       logger.error('[API GET /finalize] BACKGROUND_TASK_SECRET is not set. Cannot trigger background task.');
       return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

    // Use the relative path for the background task API route
    const backgroundTaskUrl = '/api/tasks/finalize-conversation';

    logger.info(`[API GET /finalize] Triggering background finalization for ${chatResponseId} via ${backgroundTaskUrl}`);

    fetch(backgroundTaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': BACKGROUND_TASK_SECRET,
      },
      body: JSON.stringify({ chatResponseId }),
    }).catch(fetchError => {
      logger.error(`[API GET /finalize] Error initiating background task fetch: ${fetchError.message}`, { chatResponseId });
    });
    */
    // --- End Commented Out Logic ---


    // Return a simple success response for testing
    logger.info('[API GET /finalize] Minimal handler returning OK.');
    // Adjust the return message slightly to show progress
    return NextResponse.json({ status: 'ok - url parsed', chatResponseId }, { status: 200 }); 

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[API GET /finalize] Minimal handler error: ${errorMessage}`);
    return NextResponse.json({
      error: 'Minimal handler failed',
      message: errorMessage
    }, { status: 500 });
  }
} 