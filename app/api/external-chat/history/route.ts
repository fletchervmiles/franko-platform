import { NextResponse } from "next/server";
import { getChatResponseById } from "@/db/queries/chat-responses-queries";

/**
 * GET handler for fetching chat history
 * Retrieves saved messages for a given chat response ID
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const chatResponseId = url.searchParams.get('responseId');
    
    if (!chatResponseId) {
      return NextResponse.json({ error: 'Missing responseId parameter' }, { status: 400 });
    }
    
    // Fetch the chat response from database
    const chatResponse = await getChatResponseById(chatResponseId);
    if (!chatResponse) {
      return NextResponse.json({ error: 'Chat response not found' }, { status: 404 });
    }

    // Get messages from messagesJson field
    let messages = [];
    try {
      if (chatResponse.messagesJson) {
        messages = JSON.parse(chatResponse.messagesJson);
      }
    } catch (error) {
      console.error('Error parsing messages JSON:', error);
      return NextResponse.json({ error: 'Invalid message format' }, { status: 500 });
    }
    
    // Return the messages array
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 