# Update an Existing Table Instructions

Follow these instructions to update an existing table in the database.

## Guidelines

- User ids should be like this `userId: text("user_id").notNull()` because we user Clerk

## Step 1: Update the existing schema file

The file should be created in the `db\schema` folder.

It is called `db\schema\interviews-schema.ts`

I want to add the following fields:

**I want to add the following fields**

analysis_output
analysis_part01
analysis_part02
analysis_part03
analysis_part04
analysis_part05
analysis_part06

Here is the existing schema file:

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertInterview = typeof interviewsTable.$inferInsert;
export type SelectInterview = typeof interviewsTable.$inferSelect; 
```


## Step 2: Update queries (if needed)

Located in the relevant folder: `db\queries\.ts`

the file is namedd `db\queries\interviews-queries.ts`

Here is the existing query:

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

## Step 3: Update actions (as necessary)

You'll need to update actions file in the relevant folder: `actions`

the file is called `actions\interviews-actions.ts`

Here is the existing actions files:

```typescript
"use server";

import { createInterview, deleteInterview, getInterview, getInterviews, updateInterview } from "@/db/queries/interviews-queries";
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
    const interviews = await getInterviews();
    return { status: "success", message: "Interviews retrieved successfully", data: interviews };
  } catch (error) {
    console.error("Error getting interviews:", error);
    return { status: "error", message: "Failed to get interviews" };
  }
}

export async function getInterviewAction(id: string): Promise<ActionState> {
  try {
    const interview = await getInterview(id);
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

I'll then need you to help me generate the SQL file and migrate to my database.

```bash
npm run db:generate
npm run db:migrate
```

## Step 5: Think through any steps that I may have missed in these instructions
