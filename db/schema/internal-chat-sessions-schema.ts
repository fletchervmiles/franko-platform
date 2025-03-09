import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

export const internalChatSessionsTable = pgTable("internal_chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => profilesTable.userId),
  title: text("title").notNull(),
  messagesJson: text("messages_json"),
  selectedResponses: text("selected_responses"), // Store array of chat response IDs
  contextData: text("context_data"), // Store the cached context data for reuse between requests
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertInternalChatSession = typeof internalChatSessionsTable.$inferInsert;
export type SelectInternalChatSession = typeof internalChatSessionsTable.$inferSelect;