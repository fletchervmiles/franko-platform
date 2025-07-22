import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { getModalsByUserId } from "@/db/queries/modals-queries";
import { formatProfileToUiUsageData, UiUsageData } from "@/lib/utils/usage-formatter";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modalOwnerId = searchParams.get('modalOwnerId');
    
    let targetUserId: string;
    
    if (modalOwnerId) {
      // For embedded modal usage checks, validate that modalOwnerId is a legitimate modal owner
      // We don't require the current user to be authenticated in this case
      targetUserId = modalOwnerId;
      
      // Security check: Validate that this user actually owns modals
      try {
        const userModals = await getModalsByUserId(modalOwnerId);
        if (!userModals || userModals.length === 0) {
          return new NextResponse(JSON.stringify({ error: "Invalid modal owner" }), {
            status: 403,
          });
        }
      } catch (error) {
        console.error("Error validating modal owner:", error);
        return new NextResponse(JSON.stringify({ error: "Failed to validate modal owner" }), {
          status: 500,
        });
      }
    } else {
      // Normal usage lookup - require authentication
      const { userId } = await auth();
      
      // Return 401 if not authenticated
      if (!userId) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }
      
      targetUserId = userId;
    }
    
    // Fetch user profile from database
    const profile = await getProfileByUserId(targetUserId);
    
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