"use server";

import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { InsertInterview, interviewsTable, SelectInterview } from "../schema/interviews-schema";

export const createInterview = async (data: InsertInterview) => {
  try {
    const [newInterview] = await db.insert(interviewsTable).values(data).returning();
    return newInterview;
  } catch (error) {
    console.error("Error creating interview:", error);
    throw new Error("Failed to create interview");
  }
};

export const getInterviewById = async (id: string) => {
  try {
    const interview = await db.query.interviews.findFirst({
      where: eq(interviewsTable.id, id),
    });
    return interview;
  } catch (error) {
    console.error("Error getting interview:", error);
    throw new Error("Failed to get interview");
  }
};

export const getInterviewsByUserId = async (userId: string): Promise<SelectInterview[]> => {
  try {
    const interviews = await db
      .select()
      .from(interviewsTable)
      .where(eq(interviewsTable.userId, userId));
    return interviews;
  } catch (error) {
    console.error("Error getting interviews:", error);
    throw new Error("Failed to get interviews");
  }
};

export const getAllInterviews = async (): Promise<SelectInterview[]> => {
  return db.query.interviews.findMany();
};

export const updateInterview = async (id: string, data: Partial<InsertInterview>) => {
  try {
    const [updatedInterview] = await db
      .update(interviewsTable)
      .set(data)
      .where(eq(interviewsTable.id, id))
      .returning();
    return updatedInterview;
  } catch (error) {
    console.error("Error updating interview:", error);
    throw new Error("Failed to update interview");
  }
};

export const deleteInterview = async (id: string) => {
  try {
    await db.delete(interviewsTable).where(eq(interviewsTable.id, id));
  } catch (error) {
    console.error("Error deleting interview:", error);
    throw new Error("Failed to delete interview");
  }
}; 