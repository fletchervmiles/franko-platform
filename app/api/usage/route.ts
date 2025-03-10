import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { formatProfileToUiUsageData } from "@/lib/utils/usage-formatter";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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