import { NextResponse } from 'next/server';
import { finalizeConversation } from '@/lib/utils/conversation-finalizer';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

// Simple secret check - use an environment variable
const BACKGROUND_TASK_SECRET = process.env.BACKGROUND_TASK_SECRET;

export async function POST(request: Request) {
  try {
    logger.debug('[API POST /finalize] Received request (via query param)');

    // 1. Read chatResponseId from query parameters
    const { searchParams } = new URL(request.url);
    const chatResponseId = searchParams.get('chatResponseId');

    // 2. Validate ID
    if (!chatResponseId) {
      logger.error('[API POST /finalize] Missing required query parameter: chatResponseId');
      return NextResponse.json({ error: 'Chat response ID is required in query parameters' }, { status: 400 });
    }

    // 3. Check Secret
    if (!BACKGROUND_TASK_SECRET) {
       logger.error('[API POST /finalize] BACKGROUND_TASK_SECRET is not set. Cannot trigger background task.');
       return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

    // 4. Trigger Background Task (Fire-and-Forget)
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const backgroundTaskUrl = `${protocol}://${host}/api/tasks/finalize-conversation`;

    logger.info(`[API POST /finalize] Triggering background finalization for ${chatResponseId} via ${backgroundTaskUrl}`);

    fetch(backgroundTaskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': BACKGROUND_TASK_SECRET,
      },
      // The background task still expects the ID in its body
      body: JSON.stringify({ chatResponseId }),
    }).catch(fetchError => {
      logger.error(`[API POST /finalize] Error initiating background task fetch: ${fetchError.message}`, { chatResponseId });
    });

    // 5. Return 202 Accepted immediately
    logger.info(`[API POST /finalize] Accepted request for ${chatResponseId}, background task initiated.`);
    return NextResponse.json({
      success: true,
      message: 'Conversation finalization initiated',
      chatResponseId
    }, { status: 202 });

  } catch (error) {
    // Catch errors like URL parsing or header access
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[API POST /finalize] Error processing request: ${errorMessage}`);
    return NextResponse.json({
      error: 'Failed to initiate conversation finalization',
      message: errorMessage
    }, { status: 500 });
  }
} 