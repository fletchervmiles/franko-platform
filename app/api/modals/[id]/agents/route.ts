import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getModalById 
} from "@/db/queries/modals-queries";
import { 
  getModalChatInstances,
  addAgentToModal,
  toggleModalAgent 
} from "@/db/queries/modal-chat-instances-queries";
import { agentsData } from "@/lib/agents-data";

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// GET - Get all agents for a modal
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[modals/[id]/agents] Starting GET request for modal:", params.id);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]/agents] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify modal exists and user owns it
    const modal = await getModalById(params.id, userId);
    if (!modal) {
      console.log("[modals/[id]/agents] Modal not found:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    // Get all chat instances for this modal
    const chatInstances = await getModalChatInstances(params.id, userId);
    
    // Map to agent information
    const agents = chatInstances.map(instance => {
      const agentData = agentsData.find(a => a.id === instance.agentType);
      return {
        agentType: instance.agentType,
        agentName: agentData?.name || instance.agentType,
        agentDescription: agentData?.description || '',
        isEnabled: instance.isEnabled,
        chatInstanceId: instance.id,
        conversationPlan: instance.conversationPlan,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      };
    });

    console.log("[modals/[id]/agents] Found", agents.length, "agents for modal");
    return NextResponse.json(agents);
  } catch (error) {
    console.error("[modals/[id]/agents] Error in GET handler:", error);
    return NextResponse.json({ 
      error: "Failed to fetch modal agents",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// POST - Add a new agent to the modal
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[modals/[id]/agents] Starting POST request for modal:", params.id);
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals/[id]/agents] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify modal exists and user owns it
    const modal = await getModalById(params.id, userId);
    if (!modal) {
      console.log("[modals/[id]/agents] Modal not found:", params.id);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    const body = await request.json();
    const { agentType } = body;

    // Validation
    if (!agentType || typeof agentType !== "string") {
      return NextResponse.json({ error: "Agent type is required" }, { status: 400 });
    }

    // Validate that agent exists in our agents data
    const agent = agentsData.find(a => a.id === agentType);
    if (!agent) {
      return NextResponse.json({ 
        error: `Invalid agent type: ${agentType}` 
      }, { status: 400 });
    }

    // Check if agent already exists in this modal
    const existingAgents = await getModalChatInstances(params.id, userId);
    const agentExists = existingAgents.some(instance => instance.agentType === agentType);
    if (agentExists) {
      return NextResponse.json({ 
        error: "Agent already exists in this modal" 
      }, { status: 409 });
    }

    // Create conversation plan for the agent
    const conversationPlan = {
      title: agent.name,
      description: agent.description,
      initialQuestion: agent.initialQuestion,
      objectives: {
        "1": {
          objective: agent.prompt,
          questions: [agent.initialQuestion],
          expected_min: 2,
          expected_max: 4
        }
      }
    };

    console.log("[modals/[id]/agents] Adding agent:", agentType);
    const chatInstance = await addAgentToModal(
      params.id,
      userId,
      agentType,
      conversationPlan
    );

    const response = {
      agentType: chatInstance.agentType,
      agentName: agent.name,
      agentDescription: agent.description,
      isEnabled: chatInstance.isEnabled,
      chatInstanceId: chatInstance.id,
      conversationPlan: chatInstance.conversationPlan,
      createdAt: chatInstance.createdAt,
      updatedAt: chatInstance.updatedAt
    };

    console.log("[modals/[id]/agents] Agent added successfully");
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[modals/[id]/agents] Error in POST handler:", error);
    return NextResponse.json({ 
      error: "Failed to add agent to modal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 