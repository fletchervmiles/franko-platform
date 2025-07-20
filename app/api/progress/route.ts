import { NextResponse } from 'next/server';
import { getChatInstanceProgress } from '@/db/queries/chat-instances-queries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' }, 
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

    const progress = await getChatInstanceProgress(chatId);
    
    // Create a sanitized response object that can be safely serialized to JSON
    // If progress is null or not serializable, provide a default structure
    const sanitizedResponse = progress ? {
      objectives: Object.entries(progress.objectives || {}).reduce((acc, [key, value]) => {
        // Extract only the status field from each objective
        acc[key] = { status: value.status || 'tbc' };
        return acc;
      }, {} as Record<string, { status: string }>)
    } : {
      objectives: {
        objective01: { status: "current" },
        objective02: { status: "tbc" },
        objective03: { status: "tbc" },
        objective04: { status: "tbc" }
      }
    };
    
    // Add cache control headers to prevent caching
    return NextResponse.json(sanitizedResponse, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    
    // Return a default progress structure on error
    return NextResponse.json(
      { 
        objectives: {
          objective01: { status: "current" },
          objective02: { status: "tbc" },
          objective03: { status: "tbc" },
          objective04: { status: "tbc" }
        }
      }, 
      { 
        status: 200, // Return success with default data instead of error
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