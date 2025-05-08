import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { chatResponsesTable } from "./chat-responses-schema";

export const responseArrayItemsTable = pgTable("response_array_items", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => chatResponsesTable.id, { onDelete: "cascade" }),
  arrayKey: text("array_key").notNull(), // e.g., 'featureSignals', 'characteristics'
  value: text("value"), // The actual item in the array
});

export type InsertResponseArrayItem = typeof responseArrayItemsTable.$inferInsert;
export type SelectResponseArrayItem = typeof responseArrayItemsTable.$inferSelect; 