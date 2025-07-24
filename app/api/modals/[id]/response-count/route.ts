import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getModalResponseCount, getModalById } from "@/db/queries/modals-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modalId = params.id;

    // Verify user owns this modal
    const modal = await getModalById(modalId, userId);
    if (!modal) {
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    // Get response count
    const responseCount = await getModalResponseCount(modalId);

    return NextResponse.json({ count: responseCount });
  } catch (error) {
    console.error("Error fetching modal response count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 