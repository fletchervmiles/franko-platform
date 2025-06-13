import { pgTable, text, timestamp, uuid, integer, jsonb, pgEnum, varchar } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";
import { chatInstancesTable } from "./chat-instances-schema";

export const pmfCategoryEnum = pgEnum("pmf_category_enum", ["very", "somewhat", "not"]);
export const sentimentEnum = pgEnum("sentiment_enum", ["positive", "neutral", "negative"]);

export const chatResponsesTable = pgTable("chat_responses", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  chatInstanceId: uuid("chat_instance_id")
    .notNull()
    .references(() => chatInstancesTable.id, { onDelete: "cascade" }),
  persona_category: text("persona_category").notNull().default("UNCLASSIFIED"),
  pmf_category: pmfCategoryEnum("pmf_category"),
  extraction_json: jsonb("extraction_json"),
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
  interview_type: text("interview_type"),
  sentiment: sentimentEnum("sentiment"),
  characteristics_json: jsonb("characteristics_json"),
  agentType: varchar("agent_type", { length: 50 }), // For analytics - mirrors originating agent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertChatResponse = typeof chatResponsesTable.$inferInsert;
export type SelectChatResponse = typeof chatResponsesTable.$inferSelect; 