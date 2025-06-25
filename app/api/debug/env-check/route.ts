import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check critical environment variables for the onboarding process
    const envCheck = {
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      BRANDFETCH_API_KEY: !!process.env.BRANDFETCH_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      message: "Environment check complete",
      environment: envCheck,
      userId: userId
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to check environment",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 