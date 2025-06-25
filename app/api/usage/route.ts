import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { formatProfileToUiUsageData, UiUsageData } from "@/lib/utils/usage-formatter";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check if this is an external chat request
    const referer = request.headers.get('referer') || '';
    const isExternalRequest = referer.includes('/chat/external/');
    
    // For external chat requests, return minimal usage data with correct structure
    if (isExternalRequest) {
      // Create a mock usage data object that matches the expected UiUsageData structure
      const mockUsageData: UiUsageData = {
        responses: {
          used: 0,
          total: 100,
          percentage: 0
        },
        conversationPlans: {
          used: 0,
          total: 10,
          percentage: 0
        },
        qaMessages: {
          used: 0,
          total: 100,
          percentage: 0
        }
      };
      
      return NextResponse.json({ 
        data: mockUsageData,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // For authenticated requests, continue with normal flow
    // Get the current user ID from auth
    const { userId } = await auth();
    
    // Return 401 if not authenticated
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    
    // Fetch user profile from database
    const profile = await getProfileByUserId(userId);
    
    // Return 404 if profile not found
    if (!profile) {
      return new NextResponse(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }
    
    // Format the profile data for UI display
    const usageData = formatProfileToUiUsageData(profile);
    
    // Return the usage data
    return NextResponse.json({ 
      data: usageData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
} 