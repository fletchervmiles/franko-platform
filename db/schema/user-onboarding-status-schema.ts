import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

export const userOnboardingStatusTable = pgTable("user_onboarding_status", {
  userId: text("user_id")
    .notNull()
    .primaryKey()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  step1ContextComplete: boolean("step1_context_complete").default(false).notNull(),
  step2BrandingComplete: boolean("step2_branding_complete").default(false).notNull(),
  step3PersonasReviewed: boolean("step3_personas_reviewed").default(false).notNull(),
  step4AgentCreated: boolean("step4_agent_created").default(false).notNull(),
  step5LinkShared: boolean("step5_link_shared").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUserOnboardingStatus = typeof userOnboardingStatusTable.$inferInsert;
export type SelectUserOnboardingStatus = typeof userOnboardingStatusTable.$inferSelect; 