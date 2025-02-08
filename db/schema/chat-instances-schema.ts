import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

export const chatInstancesTable = pgTable("chat_instances", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  messages: text("messages"),
  interviewGuide: text("interview_guide"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChatInstance = typeof chatInstancesTable.$inferInsert;
export type SelectChatInstance = typeof chatInstancesTable.$inferSelect; 