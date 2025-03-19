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
    // Parse request body to get chatResponseId
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { chatResponseId } = body;
    
    // Validate required parameters
    if (!chatResponseId) {
      logger.error('Missing required parameter: chatResponseId');
      return NextResponse.json({ error: 'Chat response ID is required' }, { status: 400 });
    }
    
    logger.info('Finalizing conversation:', { chatResponseId });
    
    // Call the finalizer utility
    await finalizeConversation(chatResponseId);
    
    logger.info('Conversation finalized successfully', { chatResponseId });
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Conversation finalized successfully',
      chatResponseId
    });
  } catch (error) {
    // Log and return any errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error finalizing conversation: ${errorMessage}`);
    
    return NextResponse.json({ 
      error: 'Failed to finalize conversation',
      message: errorMessage
    }, { status: 500 });
  }
} 