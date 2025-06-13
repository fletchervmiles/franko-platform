import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  createModal, 
  getModalsByUserId,
  isEmbedSlugAvailable 
} from "@/db/queries/modals-queries";
import { 
  createModalChatInstances 
} from "@/db/queries/modal-chat-instances-queries";
import { agentsData } from "@/lib/agents-data";

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// Helper function to generate a unique embed slug
function generateEmbedSlug(name: string): string {
  // Convert name to slug format
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

// GET - List all modals for the authenticated user
export async function GET() {
  try {
    console.log("[modals] Starting GET request");
    
    const { userId } = await auth();
    console.log("[modals] Auth check completed, userId exists:", !!userId);
    
    if (!userId) {
      console.log("[modals] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[modals] Fetching modals for userId:", userId);
    const modals = await getModalsByUserId(userId);
    console.log("[modals] Found modals count:", modals?.length ?? 0);

    return NextResponse.json(modals);
  } catch (error) {
    console.error("[modals] Error in GET handler:", error);
    return NextResponse.json({ 
      error: "Failed to fetch modals",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// POST - Create a new modal widget
export async function POST(request: Request) {
  try {
    console.log("[modals] Starting POST request");
    
    const { userId } = await auth();
    if (!userId) {
      console.log("[modals] No userId found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[modals] Request body received:", JSON.stringify(body, null, 2));
    
    const { name, brandSettings } = body;

    // Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Auto-generate embed slug
    let embedSlug = generateEmbedSlug(name);
    
    // Ensure slug is unique (retry with different timestamp if needed)
    let attempts = 0;
    while (!(await isEmbedSlugAvailable(embedSlug)) && attempts < 5) {
      embedSlug = generateEmbedSlug(name);
      attempts++;
    }
    
    if (attempts >= 5) {
      return NextResponse.json({ 
        error: "Unable to generate unique embed slug" 
      }, { status: 500 });
    }

    // Extract enabled agents from brandSettings
    const enabledAgents = brandSettings?.agents?.enabledAgents 
      ? Object.keys(brandSettings.agents.enabledAgents).filter(
          agentId => brandSettings.agents.enabledAgents[agentId] === true
        )
      : [];

    // If no agents enabled, enable the first 4 by default
    if (enabledAgents.length === 0) {
      enabledAgents.push(...agentsData.slice(0, 4).map(agent => agent.id));
    }

    // Validate that all enabled agents exist in our agents data
    const validAgentIds = agentsData.map(agent => agent.id);
    const invalidAgents = enabledAgents.filter(agentId => !validAgentIds.includes(agentId));
    if (invalidAgents.length > 0) {
      return NextResponse.json({ 
        error: `Invalid agent IDs: ${invalidAgents.join(', ')}` 
      }, { status: 400 });
    }

    console.log("[modals] Creating modal with data:", { name, embedSlug, enabledAgents });

    // Create the modal
    const modal = await createModal({
      userId,
      name,
      embedSlug,
      brandSettings: brandSettings || null,
      isActive: true,
    });

    console.log("[modals] Modal created with ID:", modal.id);

    // Create chat instances for enabled agents
    const enabledAgentData = enabledAgents.map(agentId => {
      const agent = agentsData.find(a => a.id === agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Create a basic conversation plan for the agent
      return {
        agentType: agentId,
        conversationPlan: {
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
        }
      };
    });

    console.log("[modals] Creating chat instances for agents:", enabledAgents);
    const chatInstances = await createModalChatInstances(
      modal.id,
      userId,
      enabledAgentData
    );

    console.log("[modals] Created chat instances count:", chatInstances.length);

    // Return the modal with chat instances
    const response = {
      modal: {
        ...modal,
        chatInstances: chatInstances.length,
        enabledAgents: enabledAgents
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("[modals] Error in POST handler:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("already taken") || error.message.includes("duplicate")) {
        return NextResponse.json({ error: "Embed slug is already taken" }, { status: 409 });
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to create modal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 