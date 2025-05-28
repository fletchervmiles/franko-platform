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
  welcomeHeading: text("welcome_heading"), // Added new field
  welcomeCardDescription: text("welcome_card_description"), // Added new field
  interview_type: text("interview_type"), // Changed from interview_classification
  published: boolean("published").default(false),
  responseEmailNotifications: boolean("response_email_notifications").default(true),
  redirect_url: text("redirect_url"), // Add the new redirect_url field here
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChatInstance = typeof chatInstancesTable.$inferInsert;
export type SelectChatInstance = typeof chatInstancesTable.$inferSelect; 