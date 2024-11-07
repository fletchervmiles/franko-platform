import { pgEnum, pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  membership: membershipEnum("membership").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firstName: text("first_name"),
  secondName: text("second_name"),
  companyUrl: text("company_url"),
  companyDescription: text("company_description"),
  companyDescriptionCompleted: boolean("company_description_completed").default(false),
  minutesTotalUsed: integer("minutes_total_used").default(0),
  minutesUsedThisMonth: integer("minutes_used_this_month").default(0),
  minutesAvailable: integer("minutes_available").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;


// this defines the profiles table in the database
// it defines the columns and the types of the columns
