import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "starter", "pro", "business"]);

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().notNull(),
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  organisationName: text("organisation_name"),
  membership: membershipEnum("membership").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firstName: text("first_name"),
  secondName: text("second_name"),
  organisationUrl: text("organisation_url"),
  organisationDescription: text("organisation_description"),
  organisationDescriptionCompleted: boolean("organisation_description_completed").default(false),
  totalResponsesUsed: integer("total_responses_used").default(0),  // renamed from totalResponsesUsedThisMonth
  totalResponsesAvailable: integer("total_responses_available").default(0),
  totalResponsesQuota: integer("total_responses_quota").default(0), // renamed from monthlyResponsesQuota
  totalChatInstanceGenerationsUsed: integer("total_chat_instance_generations_used").default(0),
  totalChatInstanceGenerationsAvailable: integer("total_chat_instance_generations_available").default(0),
  totalInternalChatQueriesUsed: integer("total_internal_chat_queries_used").default(0),
  totalInternalChatQueriesQuota: integer("total_internal_chat_queries_quota").default(0),
  totalInternalChatQueriesAvailable: integer("total_internal_chat_queries_available").default(0),
  totalChatInstanceGenerationsQuota: integer("total_chat_instance_generations_quota").default(0),
  context_update: integer("context_update").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;


// this defines the profiles table in the database
// it defines the columns and the types of the columns
