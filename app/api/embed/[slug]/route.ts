import { NextResponse } from "next/server";
import { getModalBySlug } from "@/db/queries/modals-queries";
import { getEnabledModalChatInstances } from "@/db/queries/modal-chat-instances-queries";
import { agentsData } from "@/lib/agents-data";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// GET - Get modal configuration for embed script (public access)
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    console.log("[embed/[slug]] Starting GET request for slug:", params.slug);
    
    // Get modal by slug (public access, no auth required)
    const modal = await getModalBySlug(params.slug);
    if (!modal) {
      console.log("[embed/[slug]] Modal not found for slug:", params.slug);
      return NextResponse.json({ error: "Modal not found" }, { status: 404 });
    }

    if (!modal.isActive) {
      console.log("[embed/[slug]] Modal is inactive for slug:", params.slug);
      return NextResponse.json({ error: "Modal is not active" }, { status: 404 });
    }

    // Get enabled chat instances for this modal
    const chatInstances = await getEnabledModalChatInstances(modal.id);
    
    if (chatInstances.length === 0) {
      console.log("[embed/[slug]] No enabled agents found for modal:", params.slug);
      return NextResponse.json({ error: "No agents available" }, { status: 404 });
    }

    // Map chat instances to agent information for the widget
    const agents = chatInstances.map(instance => {
      const agentData = agentsData.find(a => a.id === instance.agentType);
      return {
        id: instance.id, // Chat instance ID for starting conversations
        agentType: instance.agentType,
        name: agentData?.name || instance.agentType,
        description: agentData?.description || '',
        prompt: agentData?.prompt || '',
        icon: agentData?.Icon?.name || 'MessageCircle', // Icon name for the embed script
        color: agentData?.color || 'blue'
      };
    });

    // Prepare widget configuration
    const widgetConfig = {
      modalId: modal.id,
      embedSlug: modal.embedSlug,
      name: modal.name,
      brandSettings: modal.brandSettings || {
        displayName: "We'd love your feedback",
        instructions: "Select a topic below. Each chat is short and sharp, ≈1-3 minutes.",
        theme: "light",
        primaryBrandColor: "#3B82F6",
        advancedColors: false,
        chatIconText: "Feedback",
        chatIconColor: "#3B82F6",
        userMessageColor: "#3B82F6",
        chatHeaderColor: "#3B82F6",
        alignChatBubble: "right",
        profilePictureUrl: null
      },
      agents,
      createdAt: modal.createdAt,
      updatedAt: modal.updatedAt
    };

    console.log("[embed/[slug]] Widget config prepared with", agents.length, "agents");
    
    // Set CORS headers for embed script access
    const response = NextResponse.json(widgetConfig);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error("[embed/[slug]] Error in GET handler:", error);
    
    const errorResponse = NextResponse.json({ 
      error: "Failed to load widget configuration",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
    
    // Set CORS headers even for errors
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
} 