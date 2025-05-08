import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chatResponsesTable } from "./chat-responses-schema";

export const responseFieldsTable = pgTable("response_fields", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => chatResponsesTable.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(), // e.g., benefit, gap, valueVoice
  distilledText: text("distilled_text"), // <= 20 words
  snippet: text("snippet"), // <= 160 chars
  signal: text("signal"), // e.g., 'high', 'medium', 'low'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InsertResponseField = typeof responseFieldsTable.$inferInsert;
export type SelectResponseField = typeof responseFieldsTable.$inferSelect; 