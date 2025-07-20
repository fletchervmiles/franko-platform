import { pgTable, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

export const userOnboardingStatusTable = pgTable("user_onboarding_status", {
  userId: text("user_id")
    .notNull()
    .primaryKey()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  
  // Manual onboarding steps (existing)
  step1ContextComplete: boolean("step1_context_complete").default(false).notNull(),
  step2BrandingComplete: boolean("step2_branding_complete").default(false).notNull(),
  step3PersonasReviewed: boolean("step3_personas_reviewed").default(false).notNull(),
  step4AgentCreated: boolean("step4_agent_created").default(false).notNull(),
  step5LinkShared: boolean("step5_link_shared").default(false).notNull(),
  
  // Automated onboarding steps (new)
  step1XaAiComplete: boolean("step1_xa_ai_complete").default(false).notNull(),
  step2ContextReportComplete: boolean("step2_context_report_complete").default(false).notNull(),
  step3BrandFetchComplete: boolean("step3_brand_fetch_complete").default(false).notNull(),
  step4ConversationPlansComplete: boolean("step4_conversation_plans_complete").default(false).notNull(),
  step5ModalCreated: boolean("step5_modal_created").default(false).notNull(),
  
  // Processing tracking
  processingStatus: varchar("processing_status", { length: 50 }).default('not_started').notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUserOnboardingStatus = typeof userOnboardingStatusTable.$inferInsert;
export type SelectUserOnboardingStatus = typeof userOnboardingStatusTable.$inferSelect; 