import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getModalById 
} from "@/db/queries/modals-queries";
import { 
  toggleModalAgent,
  removeAgentFromModal 
} from "@/db/queries/modal-chat-instances-queries";
import { agentsData } from "@/lib/agents-data";

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// PATCH - Toggle agent enabled status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; agentType: string } }
) {
  try {
    console.log("[modals/[id]/agents/[agentType]] Starting PATCH request for modal:", params.id, "agent:", params.agentType);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]/agents/[agentType]] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify modal exists and user owns it
    const modal = await getModalById(params.id, userId);
    if (!modal) {
      console.log("[modals/[id]/agents/[agentType]] Modal not found:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { isEnabled } = body;

    // Validation
    if (typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "isEnabled must be a boolean" }, { status: 400 });
    }

    // Validate that agent exists in our agents data
    const agent = agentsData.find(a => a.id === params.agentType);
    if (!agent) {
      return NextResponse.json({ 
        error: `Invalid agent type: ${params.agentType}` 
      }, { status: 400 });
    }

    console.log("[modals/[id]/agents/[agentType]] Toggling agent:", params.agentType, "to:", isEnabled);
    const updatedChatInstance = await toggleModalAgent(
      params.id,
      userId,
      params.agentType,
      isEnabled
    );

    if (!updatedChatInstance) {
      console.log("[modals/[id]/agents/[agentType]] Agent not found in modal:", params.agentType);
      return NextResponse.json({ error: "Agent not found in this modal" }, { status: 404 });
    }

    const response = {
      agentType: updatedChatInstance.agentType,
      agentName: agent.name,
      agentDescription: agent.description,
      isEnabled: updatedChatInstance.isEnabled,
      chatInstanceId: updatedChatInstance.id,
      updatedAt: updatedChatInstance.updatedAt
    };

    console.log("[modals/[id]/agents/[agentType]] Agent toggled successfully");
    return NextResponse.json(response);
  } catch (error) {
    console.error("[modals/[id]/agents/[agentType]] Error in PATCH handler:", error);
    return NextResponse.json({ 
      error: "Failed to toggle agent",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// DELETE - Remove agent from modal (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; agentType: string } }
) {
  try {
    console.log("[modals/[id]/agents/[agentType]] Starting DELETE request for modal:", params.id, "agent:", params.agentType);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]/agents/[agentType]] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify modal exists and user owns it
    const modal = await getModalById(params.id, userId);
    if (!modal) {
      console.log("[modals/[id]/agents/[agentType]] Modal not found:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    // Validate that agent exists in our agents data
    const agent = agentsData.find(a => a.id === params.agentType);
    if (!agent) {
      return NextResponse.json({ 
        error: `Invalid agent type: ${params.agentType}` 
      }, { status: 400 });
    }

    console.log("[modals/[id]/agents/[agentType]] Removing agent:", params.agentType);
    await removeAgentFromModal(params.id, userId, params.agentType);

    console.log("[modals/[id]/agents/[agentType]] Agent removed successfully");
    return NextResponse.json({ 
      message: "Agent removed from modal successfully",
      agentType: params.agentType 
    });
  } catch (error) {
    console.error("[modals/[id]/agents/[agentType]] Error in DELETE handler:", error);
    return NextResponse.json({ 
      error: "Failed to remove agent from modal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 