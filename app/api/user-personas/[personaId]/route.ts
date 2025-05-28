import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Assuming Clerk
import { updateUserPersona, deleteUserPersona } from "@/db/actions/user-personas-actions";
import type { Persona } from "@/contexts/persona-context";
import { getPersonaById } from "@/db/queries/user-personas-queries"; // Import query to verify ownership

// Configure Vercel serverless function timeout (Pro plan allows longer timeouts)
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    personaId: string;
  };
}

// Helper function to verify user owns the persona
async function verifyUserOwnership(userId: string, personaId: string): Promise<boolean> {
    const persona = await getPersonaById(personaId);
    return !!persona && persona.profileUserId === userId;
}

// PATCH - Update a specific persona
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const personaId = params.personaId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!personaId) {
        return NextResponse.json({ error: "Persona ID is required" }, { status: 400 });
    }

    // Verify user owns this persona before updating
    const isOwner = await verifyUserOwnership(userId, personaId);
    if (!isOwner) {
        return NextResponse.json({ error: "Forbidden - Persona not found or not owned by user" }, { status: 403 });
    }

    const body = await request.json();
    const { label, description } = body;

    // Validate: At least one field must be provided for update
    if (label === undefined && description === undefined) {
       return NextResponse.json({ error: "No update fields provided (label or description)" }, { status: 400 });
    }
    if (label !== undefined && (typeof label !== "string" || !label.trim())) {
       return NextResponse.json({ error: "Invalid label provided" }, { status: 400 });
    }
    // Description can be null or empty string
    const newLabel = label?.trim(); // Use trimmed label if provided
    const newDescription = description; // Pass description as is (or null)

    // Note: updateUserPersona handles the case where only one field is updated
    const updatedPersonaDef = await updateUserPersona(personaId, newLabel, newDescription);

    // TODO: Ideally, return the full Persona object with calculated fields.
    // This requires fetching counts similar to the GET /api/user-personas route.
    // For simplicity now, returning the basic definition.
    return NextResponse.json(updatedPersonaDef);

  } catch (error) {
    console.error(`Error updating persona ${params.personaId}:`, error);
    if (error instanceof Error && error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: "Failed to update persona" }, { status: 500 });
  }
}

// DELETE - Archive a specific persona
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const personaId = params.personaId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

     if (!personaId) {
        return NextResponse.json({ error: "Persona ID is required" }, { status: 400 });
    }

    // Verify user ownership before deleting
    const isOwner = await verifyUserOwnership(userId, personaId);
    if (!isOwner) {
         // Return 404 or 403 - 404 might be better if we don't want to leak existence
        return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    await deleteUserPersona(personaId);

    return NextResponse.json({ message: "Persona archived successfully" }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error(`Error deleting persona ${params.personaId}:`, error);
    return NextResponse.json({ error: "Failed to archive persona" }, { status: 500 });
  }
} 