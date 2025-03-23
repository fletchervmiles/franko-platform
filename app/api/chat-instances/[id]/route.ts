import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteChatInstance, getChatInstanceById, updateChatInstance } from "@/db/queries/chat-instances-queries";
import { db } from "@/db/db";
import { chatInstancesTable } from "@/db/schema/chat-instances-schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/chat-instances/[id]
 * 
 * Retrieves minimal chat instance data needed for welcome screen and settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatInstanceId = params.id;
    if (!chatInstanceId) {
      return NextResponse.json({ error: "Missing chat instance ID" }, { status: 400 });
    }
    
    // Check if this is an external chat request
    const referer = request.headers.get('referer') || '';
    const isExternalRequest = referer.includes('/chat/external/');
    
    // Only check authentication for non-external requests
    if (!isExternalRequest) {
      const authResult = await auth();
      const userId = authResult.userId;

      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const chatInstance = await getChatInstanceById(chatInstanceId);

    if (!chatInstance) {
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }

    // Return chat instance data including notification settings
    return NextResponse.json({
      welcomeDescription: chatInstance.welcomeDescription,
      respondentContacts: chatInstance.respondentContacts,
      incentive_status: chatInstance.incentiveStatus,
      incentive_description: chatInstance.incentiveDescription,
      incentive_code: chatInstance.incentiveCode,
      response_email_notifications: chatInstance.responseEmailNotifications
    });
  } catch (error) {
    console.error("Failed to retrieve chat instance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    // Check if the chat instance exists and belongs to the user
    const chatInstance = await getChatInstanceById(id);
    
    if (!chatInstance) {
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }
    
    if (chatInstance.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Delete the chat instance
    await deleteChatInstance(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat instance:", error);
    return NextResponse.json({ error: "Failed to delete chat instance" }, { status: 500 });
  }
} 

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    // Check if the chat instance exists and belongs to the user
    const chatInstance = await getChatInstanceById(id);
    
    if (!chatInstance) {
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }
    
    if (chatInstance.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Get the data from the request body
    const body = await request.json();
    const { title, incentiveStatus, incentiveCode, incentiveDescription } = body;
    
    // If we have incentive settings in the request
    if (incentiveStatus !== undefined) {
      // Update the incentive settings
      const updates = {
        incentiveStatus,
        incentiveCode: incentiveCode || "",
        incentiveDescription: incentiveDescription || "",
        updatedAt: new Date(),
      };

      const updatedChatInstance = await updateChatInstance(id, updates);
      
      return NextResponse.json({ 
        success: true,
        id: id,
        incentiveStatus: updatedChatInstance?.incentiveStatus,
        incentiveCode: updatedChatInstance?.incentiveCode,
        incentiveDescription: updatedChatInstance?.incentiveDescription
      });
    }
    
    // Handle title update (original functionality)
    if (title) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      
      // Update the conversation plan with the new title
      const conversationPlan = chatInstance.conversationPlan as any;
      if (!conversationPlan) {
        return NextResponse.json({ error: "Conversation plan not found" }, { status: 404 });
      }
      
      // Update the title in the conversation plan
      conversationPlan.title = title;
      
      // Update the chat instance with the new conversation plan
      const updatedChatInstance = await updateChatInstance(id, {
        conversationPlan,
        conversationPlanLastEdited: new Date(),
      });
      
      return NextResponse.json({ 
        success: true,
        title: title,
        id: id
      });
    }
    
    return NextResponse.json({ error: "No valid update parameters provided" }, { status: 400 });
  } catch (error) {
    console.error("Error updating chat instance:", error);
    return NextResponse.json({ error: "Failed to update chat instance" }, { status: 500 });
  }
}