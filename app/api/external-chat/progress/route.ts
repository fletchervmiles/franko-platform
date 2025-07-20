/**
 * External Chat Progress API Route
 * 
 * OVERVIEW:
 * This API endpoint retrieves the current progress status of an ongoing external chat session.
 * It provides real-time information about the chat's status, completion state, and any 
 * stored progress data. This endpoint is designed to be polled periodically by the client 
 * to update UI elements reflecting the chat's current state.
 * 
 * FLOW:
 * 1. Receives a chatResponseId as a query parameter
 * 2. Validates the chat response exists in the database
 * 3. Parses any stored chat progress data (which may be stored as a JSON string)
 * 4. Returns a sanitized response object with only the necessary fields
 * 5. Includes cache control headers to prevent response caching
 * 
 * USED BY:
 * - The external chat UI components to show loading/progress indicators
 * - Status monitoring on the client side to determine if a chat is complete
 * - May be polled at regular intervals to provide real-time updates
 * 
 * DEPENDENCIES:
 * - Database queries for chat responses
 * - Next.js Response handling
 * - Logger for error tracking
 */

import { NextResponse } from 'next/server';
import { getChatResponseById } from '@/db/queries/chat-responses-queries';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to fetch the current progress of an external chat
 * 
 * @param request - The incoming HTTP request containing the chatResponseId as a query parameter
 * @returns NextResponse - JSON response with the chat progress data or an error message
 */
export async function GET(request: Request) {
  try {
    // Extract the chatResponseId from query parameters
    const { searchParams } = new URL(request.url);
    const chatResponseId = searchParams.get('chatResponseId');

    // Validate that a chatResponseId was provided
    if (!chatResponseId) {
      return NextResponse.json(
        { error: 'Chat Response ID is required' }, 
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        }
      );
    }

    // Retrieve the chat response record from the database
    const chatResponse = await getChatResponseById(chatResponseId);
    
    // Verify the chat response exists
    if (!chatResponse) {
      return NextResponse.json(
        { error: 'Chat response not found' }, 
        { status: 404 }
      );
    }

    // Parse chatProgress if it exists and is a string
    let parsedChatProgress = null;
    if (chatResponse.chatProgress) {
      try {
        // If it's a string, parse it to an object
        if (typeof chatResponse.chatProgress === 'string') {
          parsedChatProgress = JSON.parse(chatResponse.chatProgress);
        } 
        // If it's already an object, use it directly
        else {
          parsedChatProgress = chatResponse.chatProgress;
        }
      } catch (error) {
        logger.error('Error parsing chat progress:', error);
        // If we can't parse it, return null for chatProgress
      }
    }

    // Create a sanitized response object that can be safely serialized to JSON
    // Use a restricted set of properties rather than passing the raw database object
    const sanitizedResponse = {
      id: chatResponse.id,
      status: chatResponse.status || 'not_started',
      completionStatus: chatResponse.completionStatus || 'not_started',
      chatProgress: parsedChatProgress,
      updatedAt: chatResponse.updatedAt?.toISOString()
    };
    
    // Return the sanitized response with cache control headers to prevent caching
    // This ensures clients always get the latest progress data
    return NextResponse.json(sanitizedResponse, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    // Log any unexpected errors and return a generic error response
    logger.error('Error fetching external chat progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  }
} 