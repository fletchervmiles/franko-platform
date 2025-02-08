"use server";

import { createConversation, deleteConversation, getConversationById, getConversationsByUserId, updateConversation } from "@/db/queries/conversations-queries";
import { InsertCreatorConversation, ChatMessage } from "@/db/schema/conversations-schema";
import { revalidatePath } from "next/cache";

type ActionState = {
  status: "success" | "error";
  message: string;
  data?: any;
};

export async function createConversationAction(conversation: InsertCreatorConversation): Promise<ActionState> {
  try {
    const newConversation = await createConversation(conversation);
    revalidatePath("/create-conversation");
    return { status: "success", message: "Conversation created successfully", data: newConversation };
  } catch (error) {
    console.error("Error creating conversation:", error);
    return { status: "error", message: "Failed to create conversation" };
  }
}

export async function getConversationsAction(userId: string): Promise<ActionState> {
  try {
    const conversations = await getConversationsByUserId(userId);
    return { status: "success", message: "Conversations retrieved successfully", data: conversations };
  } catch (error) {
    console.error("Error getting conversations:", error);
    return { status: "error", message: "Failed to get conversations" };
  }
}

export async function getConversationAction(id: string, userId: string): Promise<ActionState> {
  try {
    const conversation = await getConversationById(id, userId);
    return { status: "success", message: "Conversation retrieved successfully", data: conversation };
  } catch (error) {
    console.error("Error getting conversation:", error);
    return { status: "error", message: "Failed to get conversation" };
  }
}

export async function updateConversationAction(id: string, userId: string, messages: ChatMessage[]): Promise<ActionState> {
  try {
    const updatedConversation = await updateConversation(id, userId, messages);
    revalidatePath("/create-conversation");
    return { status: "success", message: "Conversation updated successfully", data: updatedConversation };
  } catch (error) {
    console.error("Error updating conversation:", error);
    return { status: "error", message: "Failed to update conversation" };
  }
}

export async function deleteConversationAction(id: string, userId: string): Promise<ActionState> {
  try {
    await deleteConversation(id, userId);
    revalidatePath("/create-conversation");
    return { status: "success", message: "Conversation deleted successfully" };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { status: "error", message: "Failed to delete conversation" };
  }
} 