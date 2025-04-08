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
import { finalizeConversation } from '@/lib/utils/conversation-finalizer';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers'; // Import headers to get host

const BACKGROUND_TASK_SECRET = process.env.BACKGROUND_TASK_SECRET;

/**
 * POST Request Handler
 * 
 * Triggers the conversation finalization process:
 * - Updates end time and duration
 * - Calculates completion status
 * - Generates transcript and summary
 * - Sends notifications
 */
export async function POST(request: Request) {
  try {
    logger.debug('[API POST /finalize] Received request');
    let body;
    try {
      // Use the clone + text + parse method as it seemed most reliable for reading
      const clonedRequest = request.clone();
      const rawBody = await clonedRequest.text();
      body = JSON.parse(rawBody);
      logger.debug('[API POST /finalize] Request body parsed successfully', { bodyKeys: Object.keys(body) });
    } catch (error) {
      logger.error('[API POST /finalize] Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { chatResponseId } = body;
    
    if (!chatResponseId) {
      logger.error('[API POST /finalize] Missing required parameter: chatResponseId');
      return NextResponse.json({ error: 'Chat response ID is required' }, { status: 400 });
    }

    // --- Trigger Background Task (Fire-and-Forget) ---
    if (!BACKGROUND_TASK_SECRET) {
       logger.error('[API POST /finalize] BACKGROUND_TASK_SECRET is not set. Cannot trigger background task.');
       // Return 500 or handle appropriately
       return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

    // Construct the full URL for the background task API route
    const host = headers().get('host'); // Get the host (e.g., localhost:3000 or your domain)
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const backgroundTaskUrl = `${protocol}://${host}/api/tasks/finalize-conversation`;

    logger.info(`[API POST /finalize] Triggering background finalization for ${chatResponseId} via ${backgroundTaskUrl}`);

    // Use fetch without await for fire-and-forget
    fetch(backgroundTaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': BACKGROUND_TASK_SECRET, // Add the secret header
      },
      body: JSON.stringify({ chatResponseId }),
    }).catch(fetchError => {
      // Log errors initiating the fetch itself, but don't block the response
      logger.error(`[API POST /finalize] Error initiating background task fetch: ${fetchError.message}`, { chatResponseId });
    });
    // ------------------------------------------------

    // Return 202 Accepted immediately
    logger.info(`[API POST /finalize] Accepted request for ${chatResponseId}, background task initiated.`);
    return NextResponse.json({
      success: true,
      message: 'Conversation finalization initiated',
      chatResponseId
    }, { status: 202 }); // Use 202 Accepted status

  } catch (error) {
    // Catch errors *before* initiating the background task (e.g., body parsing)
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[API POST /finalize] Error processing request: ${errorMessage}`);
    return NextResponse.json({
      error: 'Failed to initiate conversation finalization',
      message: errorMessage
    }, { status: 500 });
  }
} 