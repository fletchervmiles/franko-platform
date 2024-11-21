# Update Table Instructions

Follow these instructions to update  a new table in the database.

## Guidelines

- User ids should be like this `userId: text("user_id").notNull()` because we user Clerk

## Step 1: Update the Schema

This is an example of how to update an existing table in the database.

The table to update is - `interviews-schema.ts`.

This file is located in the `db/schema` folder.

Make sure to export the `interviews-schema.ts` file in the `db/schema/index.ts` file. (This should already be done but let's double check)

Make sure to add the table to the `schema` object in the `db/db.ts` file.

Below is an example of the existing table. The following fields should be added:

**Fields to be added**

- status


```typescript
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const interviewsTable = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  clientName: text("client_name").notNull(),
  uniqueCustomerIdentifier: text("unique_customer_identifier").notNull(),
  useCase: text("use_case").notNull(),
  intervieweeFirstName: text("interviewee_first_name").notNull(),
  intervieweeLastName: text("interviewee_last_name").notNull(),
  intervieweeEmail: text("interviewee_email").notNull(),
  intervieweeNumber: text("interviewee_number"),
  callId: text("call_id").notNull(),
  dateCompleted: timestamp("date_completed").notNull(),
  interviewStartTime: timestamp("interview_start_time").notNull(),
  interviewEndTime: timestamp("interview_end_time").notNull(),
  totalInterviewMinutes: integer("total_interview_minutes").notNull(),
  conversationHistoryRaw: text("conversation_history_raw"),
  conversationHistoryCleaned: text("conversation_history_cleaned"),
  interviewAudioLink: text("interview_audio_link"),
  clientCompanyDescription: text("client_company_description"),
  agentName: text("agent_name").notNull(),
  voiceId: text("voice_id").notNull(),
  analysisOutput: text("analysis_output"),
  analysisPart01: text("analysis_part01"),
  analysisPart02: text("analysis_part02"),
  analysisPart03: text("analysis_part03"),
  analysisPart04: text("analysis_part04"),
  analysisPart05: text("analysis_part05"),
  analysisPart06: text("analysis_part06"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertInterview = typeof interviewsTable.$inferInsert;
export type SelectInterview = typeof interviewsTable.$inferSelect; 
```

## Step 2: Update the Queries (as required)

Ensure queries for the table are updated

This existing file is named `interviews-queries.ts`.

This file is located in the `db/queries` folder.

Updated the queries to ensure new fields are available.

```typescript
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
```

## Step 3: Update the Actions

The actions already exist for the table - these will need to be updated as needed.

This file is named `interviews-actions.ts`. It's located in the `/actions` folder

```typescript
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
```

## Step 4: Generate the SQL file and Migrate the DB

```bash
npm run db:generate
npm run db:migrate
```