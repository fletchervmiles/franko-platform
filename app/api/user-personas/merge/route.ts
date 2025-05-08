import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Assuming Clerk
import { mergeUserPersonas } from "@/db/actions/user-personas-actions";
import { getPersonaById } from "@/db/queries/user-personas-queries"; // Import query to verify ownership

// Configure Vercel serverless function timeout (Pro plan allows longer timeouts)
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

// Helper function to verify user owns the persona
async function verifyUserOwnership(userId: string, personaId: string): Promise<boolean> {
    const persona = await getPersonaById(personaId);
    return !!persona && persona.profileUserId === userId;
}

// POST - Merge two personas
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, targetId } = body;

    if (!sourceId || !targetId) {
      return NextResponse.json({ error: "Both sourceId and targetId are required" }, { status: 400 });
    }

    if (sourceId === targetId) {
        return NextResponse.json({ error: "Source and target IDs cannot be the same" }, { status: 400 });
    }

    // Verify user owns BOTH personas before merging
    const isSourceOwner = await verifyUserOwnership(userId, sourceId);
    const isTargetOwner = await verifyUserOwnership(userId, targetId);

    if (!isSourceOwner || !isTargetOwner) {
        // Use 404 to avoid leaking info about which one wasn't found/owned
        return NextResponse.json({ error: "One or both personas not found" }, { status: 404 });
    }

    await mergeUserPersonas(userId, sourceId, targetId);

    return NextResponse.json({ message: "Personas merged successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error merging user personas:", error);
    // Handle specific errors from the action if needed
    return NextResponse.json({ error: "Failed to merge personas" }, { status: 500 });
  }
} 