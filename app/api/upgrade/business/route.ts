import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/actions/stripe-actions";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/db/queries/profiles-queries";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the user's profile to get their email
    const profile = await getProfileByUserId(userId);
    
    if (!profile || !profile.email) {
      return NextResponse.json(
        { error: "User profile or email not found" },
        { status: 400 }
      );
    }

    // Create a checkout session for the business plan
    const session = await createCheckoutSession(userId, "business", profile.email);
    
    if (session?.url) {
      // Redirect to the checkout URL
      return NextResponse.redirect(session.url);
    } else {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in business upgrade route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 