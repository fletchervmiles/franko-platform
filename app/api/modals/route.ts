import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  createModal, 
  getModalsByUserId,
  isEmbedSlugAvailable 
} from "@/db/queries/modals-queries";
import { 
  createModalChatInstances,
  getUserAgentChatInstance
} from "@/db/queries/modal-chat-instances-queries";
import { agentsData } from "@/lib/agents-data";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { isDarkColor } from "@/lib/color-utils";

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
    
    const { name, brandSettings, reuseExistingPlans } = body;

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

    // ------------------------------------------------------------------
    // Apply logo + theme defaults based on the user profile
    // ------------------------------------------------------------------
    const profile = await getProfileByUserId(userId);

    // Clone the incoming brandSettings (or initialise) so we never mutate
    // the caller's object reference.
    const finalBrandSettings: any = brandSettings ? { ...brandSettings } : {};

    // Ensure interface object exists
    finalBrandSettings.interface = finalBrandSettings.interface || {};
    const iface: any = finalBrandSettings.interface;

    // 1. Default logo
    if (!iface.profilePictureUrl && profile?.logoUrl) {
      iface.profilePictureUrl = profile.logoUrl;
    }

    // 2. Default theme (light/dark) – pick based on profile.buttonColor luminance
    if (!iface.theme) {
      const chosenTheme = profile?.buttonColor && isDarkColor(profile.buttonColor)
        ? "dark"
        : "light";
      iface.theme = chosenTheme;
    }

    // 3. Clear colour overrides unless caller explicitly provided them
    const colourFields = [
      "primaryBrandColor",
      "chatIconColor",
      "userMessageColor",
      "chatHeaderColor",
    ];

    for (const field of colourFields) {
      if (iface[field] === undefined) {
        // chatHeaderColor expects null; others expect ""
        iface[field] = field === "chatHeaderColor" ? null : "";
      }
    }

    // 4. Ensure advancedColors flag is false by default
    if (iface.advancedColors === undefined) {
      iface.advancedColors = false;
    }

    // Create the modal (pass our enriched brand settings)
    const modal = await createModal({
      userId,
      name,
      embedSlug,
      brandSettings: finalBrandSettings,
      isActive: true,
    });

    console.log("[modals] Modal created with ID:", modal.id);

    // Build enabledAgentData array with conversation plans
    const enabledAgentData: Array<{ agentType: string; conversationPlan: any }> = [];

    for (const agentId of enabledAgents) {
      let conversationPlan: any | null = null;

      // If flag set, attempt to reuse existing plan
      if (reuseExistingPlans) {
        const existingInstance = await getUserAgentChatInstance(userId, agentId);
        if (existingInstance?.conversationPlan) {
          conversationPlan = existingInstance.conversationPlan;
        }
      }

      // If no existing plan found, generate a basic one from agentsData
      if (!conversationPlan) {
        const agent = agentsData.find(a => a.id === agentId);
        if (!agent) {
          throw new Error(`Agent ${agentId} not found`);
        }
        conversationPlan = {
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
      }

      enabledAgentData.push({ agentType: agentId, conversationPlan });
    }

    // Create chat instances for agents (reusing plans where provided)
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