import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export const creatorConversationsTable = pgTable("creator_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  messages: jsonb("messages").$type<ChatMessage[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertCreatorConversation = typeof creatorConversationsTable.$inferInsert;
export type SelectCreatorConversation = typeof creatorConversationsTable.$inferSelect; 