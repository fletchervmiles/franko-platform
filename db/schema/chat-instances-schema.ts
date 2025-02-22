import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

// Add ObjectiveProgress interface
export interface ObjectiveProgress {
  objectives: Record<string, {
    status: "done" | "current" | "tbc";
    comments: string[];
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChatInstance = typeof chatInstancesTable.$inferInsert;
export type SelectChatInstance = typeof chatInstancesTable.$inferSelect; 