import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getChatInstanceById, updateChatInstance } from "@/db/queries/chat-instances-queries";

export async function POST(
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
    
    // Update the lastViewed timestamp
    const updatedChatInstance = await updateChatInstance(id, {
      lastViewed: new Date(),
    });
    
    return NextResponse.json({ 
      success: true,
      id: id,
      lastViewed: updatedChatInstance?.lastViewed
    });
  } catch (error) {
    console.error("Error updating last viewed timestamp:", error);
    return NextResponse.json({ error: "Failed to update last viewed timestamp" }, { status: 500 });
  }
} 