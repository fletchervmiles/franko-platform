import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteChatInstance, getChatInstanceById, updateChatInstance } from "@/db/queries/chat-instances-queries";

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
    
    // Get the new title from the request body
    const body = await request.json();
    const { title } = body;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
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
  } catch (error) {
    console.error("Error renaming chat instance:", error);
    return NextResponse.json({ error: "Failed to rename chat instance" }, { status: 500 });
  }
} 