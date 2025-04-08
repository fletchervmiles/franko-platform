import { NextResponse } from 'next/server';
import { finalizeConversation } from '@/lib/utils/conversation-finalizer';
import { logger } from '@/lib/logger';

// Simple secret check - use an environment variable
const BACKGROUND_TASK_SECRET = process.env.BACKGROUND_TASK_SECRET;

export async function POST(request: Request) {
  // 1. Security Check
  const secretHeader = request.headers.get('X-Internal-Secret');
  if (!BACKGROUND_TASK_SECRET || secretHeader !== BACKGROUND_TASK_SECRET) {
    logger.warn('[BackgroundTask: Finalize] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse Body
  let body;
  try {
    // Cloning might still be safer even here, though less likely to conflict
    const clonedRequest = request.clone();
    body = await clonedRequest.json();
  } catch (error) {
    logger.error('[BackgroundTask: Finalize] Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { chatResponseId } = body;

  // 3. Validate ID
  if (!chatResponseId) {
    logger.error('[BackgroundTask: Finalize] Missing required parameter: chatResponseId');
    return NextResponse.json({ error: 'Chat response ID is required' }, { status: 400 });
  }

  // 4. Execute the long-running task
  try {
    logger.info('[BackgroundTask: Finalize] Starting finalization job', { chatResponseId });
    await finalizeConversation(chatResponseId);
    logger.info('[BackgroundTask: Finalize] Finalization job completed successfully', { chatResponseId });
    // Return success, although this response isn't directly used by the caller (fire-and-forget)
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[BackgroundTask: Finalize] Error during finalizeConversation: ${errorMessage}`, { chatResponseId, stack: error instanceof Error ? error.stack : undefined });
    // Return an error status - useful for Vercel logs
    return NextResponse.json({ error: 'Finalization task failed', message: errorMessage }, { status: 500 });
  }
} 