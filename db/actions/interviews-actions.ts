"use server";

import { createInterview, updateInterview } from "@/db/queries/interviews-queries";
import { InsertInterview } from "@/db/schema/interviews-schema";
import { revalidatePath } from "next/cache";

type ActionState = {
  status: "success" | "error";
  message: string;
  data?: any;
};

export async function createInterviewAction(interview: InsertInterview): Promise<ActionState> {
  try {
    // Ensure status is set correctly for new interviews
    const normalizedInterview = {
      ...interview,
      status: interview.status?.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review'
    };
    const newInterview = await createInterview(normalizedInterview);
    revalidatePath("/interview");
    return { status: "success", message: "Interview created successfully", data: newInterview };
  } catch (error) {
    console.error("Error creating interview:", error);
    return { status: "error", message: "Failed to create interview" };
  }
}

export async function updateInterviewAction(id: string, data: Partial<InsertInterview>): Promise<ActionState> {
  try {
    // Normalize status if it's being updated
    const normalizedData = {
      ...data,
      status: data.status ? 
        (data.status.toLowerCase() === 'reviewed' ? 'reviewed' : 'ready for review') 
        : undefined
    };
    const updatedInterview = await updateInterview(id, normalizedData);
    revalidatePath("/interview");
    return { status: "success", message: "Interview updated successfully", data: updatedInterview };
  } catch (error) {
    console.error("Error updating interview:", error);
    return { status: "error", message: "Failed to update interview" };
  }
} 