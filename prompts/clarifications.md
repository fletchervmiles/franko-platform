Ok. I think there's some confusion here.

the `selected_responses` field right now in the `internal-chat-sessions-schema` is for the `chat-instance-schema` recorded.

Here's the hierachy. 

The userID is stored in the `db\schema\profiles-schema.ts`

This is the parent of the actual account holder - the top level ID. 

```typescript
import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "starter", "pro"]);

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().notNull(),
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  organisationName: text("organisation_name"),
  membership: membershipEnum("membership").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firstName: text("first_name"),
  secondName: text("second_name"),
  organisationUrl: text("organisation_url"),
  organisationDescription: text("organisation_description"),
  organisationDescriptionCompleted: boolean("organisation_description_completed").default(false),
  totalResponsesUsed: integer("total_responses_used").default(0),
  totalResponsesUsedThisMonth: integer("total_responses_used_this_month").default(0),
  totalResponsesAvailable: integer("total_responses_available").default(0),
  monthlyResponsesQuota: integer("monthly_responses_quota").default(0),
  totalChatInstancesUsed: integer("total_chat_instances_used").default(0),
  totalChatInstancesAvailable: integer("total_chat_instances_available").default(0),
  totalInternalChatQueriesUsed: integer("total_internal_chat_queries_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;


// this defines the profiles table in the database
// it defines the columns and the types of the columns
```

The next is the `db\schema\chat-instances-schema.ts`

This schema is the parent to the individual responses. Imagine if we had a survey tool. This would be the structure of the survey. This is where we have the "conversation_plan" that we want to extract for the "context_data"

```typescript
import { pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

// Update ObjectiveProgress interface to make comments optional
export interface ObjectiveProgress {
  overall_turns: number;
  expected_total_min: number;
  expected_total_max: number;
  objectives: Record<string, {
    status: "done" | "current" | "tbc";
    comments?: string[];
    turns_used: number;
    expected_min: number;
    expected_max: number;
  }>;
}

export const chatInstancesTable = pgTable("chat_instances", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  messages: text("messages"),
  conversationPlan: jsonb("conversation_plan"),
  objectiveProgress: jsonb("objective_progress"),  // Add new field
  conversationPlanLastEdited: timestamp("conversation_plan_last_edited").defaultNow().notNull(),
  lastViewed: timestamp("last_viewed"), // Add lastViewed field to track when the user last viewed responses
  // New fields
  topic: text("topic"),
  duration: text("duration"),
  respondentContacts: boolean("respondent_contacts"),
  incentiveStatus: boolean("incentive_status"),
  incentiveCode: text("incentive_code"),
  incentiveDescription: text("incentive_description"),
  additionalDetails: text("additional_details"),
  welcomeDescription: text("welcome_description"), // Added new field
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChatInstance = typeof chatInstancesTable.$inferInsert;
export type SelectChatInstance = typeof chatInstancesTable.$inferSelect; 
```

Finally, we have the `db\schema\chat-responses-schema.ts`

This is where we store the individual responses. 

```typescript
import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";
import { chatInstancesTable } from "./chat-instances-schema";

export const chatResponsesTable = pgTable("chat_responses", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  chatInstanceId: uuid("chat_instance_id")
    .notNull()
    .references(() => chatInstancesTable.id, { onDelete: "cascade" }),
  completionStatus: text("completion_status"),
  status: text("status"),
  chatProgress: jsonb("chat_progress"),
  intervieweeFirstName: text("interviewee_first_name"),
  intervieweeSecondName: text("interviewee_second_name"),
  intervieweeEmail: text("interviewee_email"),
  interviewStartTime: timestamp("interview_start_time"),
  interviewEndTime: timestamp("interview_end_time"),
  totalInterviewMinutes: integer("total_interview_minutes"),
  messagesJson: text("messages_json"),
  cleanTranscript: text("clean_transcript"),
  user_words: text("user_words"),
  transcript_summary: text("transcript_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChatResponse = typeof chatResponsesTable.$inferInsert;
export type SelectChatResponse = typeof chatResponsesTable.$inferSelect; 
```

---

Here's how the context_data should be constructed:

