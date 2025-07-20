import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { modalsTable } from "@/db/schema/modals-schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch modal names for the user
    const modals = await db
      .select({
        name: modalsTable.name,
      })
      .from(modalsTable)
      .where(eq(modalsTable.userId, userId))
      .orderBy(modalsTable.name);

    // Extract just the names
    const modalNames = modals.map(modal => modal.name);

    return NextResponse.json(modalNames);

  } catch (error) {
    console.error("Failed to fetch modal names:", error);
    return NextResponse.json(
      { error: "Failed to fetch modal names", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 