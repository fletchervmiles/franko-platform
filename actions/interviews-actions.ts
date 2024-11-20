"use server";

import { createInterview, deleteInterview, getInterviewById, getAllInterviews, updateInterview } from "@/db/queries/interviews-queries";
import { InsertInterview } from "@/db/schema/interviews-schema";
import { ActionState } from "@/types";
import { revalidatePath } from "next/cache";

export async function createInterviewAction(interview: InsertInterview): Promise<ActionState> {
  try {
    const newInterview = await createInterview(interview);
    revalidatePath("/interview");
    return { status: "success", message: "Interview created successfully", data: newInterview };
  } catch (error) {
    console.error("Error creating interview:", error);
    return { status: "error", message: "Failed to create interview" };
  }
}

export async function getInterviewsAction(): Promise<ActionState> {
  try {
    const interviews = await getAllInterviews();
    return { status: "success", message: "Interviews retrieved successfully", data: interviews };
  } catch (error) {
    console.error("Error getting interviews:", error);
    return { status: "error", message: "Failed to get interviews" };
  }
}

export async function getInterviewAction(id: string): Promise<ActionState> {
  try {
    const interview = await getInterviewById(id);
    return { status: "success", message: "Interview retrieved successfully", data: interview };
  } catch (error) {
    console.error("Error getting interview by ID:", error);
    return { status: "error", message: "Failed to get interview" };
  }
}

export async function updateInterviewAction(id: string, data: Partial<InsertInterview>): Promise<ActionState> {
  try {
    const updatedInterview = await updateInterview(id, data);
    revalidatePath("/interview");
    return { status: "success", message: "Interview updated successfully", data: updatedInterview };
  } catch (error) {
    console.error("Error updating interview:", error);
    return { status: "error", message: "Failed to update interview" };
  }
}

export async function deleteInterviewAction(id: string): Promise<ActionState> {
  try {
    await deleteInterview(id);
    revalidatePath("/interview");
    return { status: "success", message: "Interview deleted successfully" };
  } catch (error) {
    console.error("Error deleting interview:", error);
    return { status: "error", message: "Failed to delete interview" };
  }
} 