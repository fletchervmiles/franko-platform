import { NextResponse } from 'next/server';
import { getChatInstanceById } from '@/db/queries/chat-instances-queries';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat ID from query params
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Get chat instance
    const chat = await getChatInstanceById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user owns the chat
    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return the objective progress
    return NextResponse.json({
      objectiveProgress: chat.objectiveProgress,
      chatId: chat.id,
      userId: chat.userId
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 