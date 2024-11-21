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
  status: text("status").notNull().default("ready_for_review"),
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
  analysisOutput: text("analysis_output"),
  analysisPart01: text("analysis_part01"),
  analysisPart02: text("analysis_part02"),
  analysisPart03: text("analysis_part03"),
  analysisPart04: text("analysis_part04"),
  analysisPart05: text("analysis_part05"),
  analysisPart06: text("analysis_part06"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertInterview = typeof interviewsTable.$inferInsert;
export type SelectInterview = typeof interviewsTable.$inferSelect; 