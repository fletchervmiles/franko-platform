import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user profile from database
    const profile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });
    
    if (!profile) {
      return NextResponse.json(
        { membership: "free" }, // Default to free if no profile exists
        { status: 200 }
      );
    }
    
    return NextResponse.json(profile, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
} 