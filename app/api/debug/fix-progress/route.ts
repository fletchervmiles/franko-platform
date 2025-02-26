import { NextResponse } from 'next/server';
import { getChatInstanceById, updateChatInstance } from '@/db/queries/chat-instances-queries';
import { auth } from '@clerk/nextjs/server';
import type { ObjectiveProgress } from '@/db/schema/chat-instances-schema';

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat ID from request body
    const { chatId } = await request.json();

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

    // Get current progress
    const currentProgress = chat.objectiveProgress as ObjectiveProgress | null;
    
    // Initialize or fix progress
    const fixedProgress: ObjectiveProgress = {
      objectives: {}
    };

    // If there's existing progress, copy over the statuses but fix the structure
    if (currentProgress?.objectives) {
      // Copy existing objectives with correct structure
      for (const [key, obj] of Object.entries(currentProgress.objectives)) {
        fixedProgress.objectives[key] = {
          status: obj.status
          // No comments field unless needed
        };
      }
    } else {
      // Create default progress
      fixedProgress.objectives = {
        obj1: { status: "current" },
        obj2: { status: "tbc" },
        obj3: { status: "tbc" },
        obj4: { status: "tbc" },
        obj5: { status: "tbc" }
      };
    }

    // Update the chat instance with fixed progress
    await updateChatInstance(chatId, { objectiveProgress: fixedProgress });

    // Return the fixed progress
    return NextResponse.json({
      success: true,
      previousProgress: currentProgress,
      fixedProgress
    });
  } catch (error) {
    console.error('Error fixing progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 