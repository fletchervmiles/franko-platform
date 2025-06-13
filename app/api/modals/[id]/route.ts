import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getModalById, 
  updateModal, 
  deleteModal 
} from "@/db/queries/modals-queries";
import { 
  getModalChatInstances 
} from "@/db/queries/modal-chat-instances-queries";

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// GET - Get a specific modal by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[modals/[id]] Starting GET request for modal:", params.id);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const modal = await getModalById(params.id, userId);
    if (!modal) {
      console.log("[modals/[id]] Modal not found:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    // Get associated chat instances
    const chatInstances = await getModalChatInstances(params.id, userId);
    
    // Return modal with chat instances info
    const response = {
      modal: {
        ...modal,
        chatInstances: chatInstances.map(instance => ({
          id: instance.id,
          agentType: instance.agentType,
          isEnabled: instance.isEnabled,
          conversationPlan: instance.conversationPlan,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt
        }))
      }
    };

    console.log("[modals/[id]] Modal found with", chatInstances.length, "chat instances");
    return NextResponse.json(response);
  } catch (error) {
    console.error("[modals/[id]] Error in GET handler:", error);
    return NextResponse.json({ 
      error: "Failed to fetch modal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// PATCH - Update a modal
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[modals/[id]] Starting PATCH request for modal:", params.id);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[modals/[id]] PATCH body received:", JSON.stringify(body, null, 2));

    const { name, brandSettings, isActive } = body;

    // Build update object with only provided fields
    const updates: any = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
      }
      updates.name = name.trim();
    }
    if (brandSettings !== undefined) {
      updates.brandSettings = brandSettings;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
      }
      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    console.log("[modals/[id]] Updating modal with:", updates);
    const updatedModal = await updateModal(params.id, userId, updates);
    
    if (!updatedModal) {
      console.log("[modals/[id]] Modal not found for update:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    console.log("[modals/[id]] Modal updated successfully");
    return NextResponse.json({ modal: updatedModal });
  } catch (error) {
    console.error("[modals/[id]] Error in PATCH handler:", error);
    return NextResponse.json({ 
      error: "Failed to update modal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE - Delete a modal
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[modals/[id]] Starting DELETE request for modal:", params.id);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if modal exists first
    const modal = await getModalById(params.id, userId);
    if (!modal) {
      console.log("[modals/[id]] Modal not found for deletion:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    console.log("[modals/[id]] Deleting modal:", params.id);
    await deleteModal(params.id, userId);

    console.log("[modals/[id]] Modal deleted successfully");
    return NextResponse.json({ message: "Modal deleted successfully" });
  } catch (error) {
    console.error("[modals/[id]] Error in DELETE handler:", error);
    return NextResponse.json({ 
      error: "Failed to delete modal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 