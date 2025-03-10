# Context

I've updated my profiles schema to include all usage metrics. Here is the schema:

```typescript
import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "starter", "pro"]);

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
```

We have already updated the code so that the relevant increments and counts occur on usage. Our focus now is on displaying these values in the UI, which also includes the relevant calculations. And also, reviewing the existing code, to understand what code we have already, and what updates we need to make to reach out desired implementation.

## Values

We have the following set of values:

These values should correspond to "Responses" in the UI:

total_responses_used (this will be updated in the code each time a response is submitted, incremented by one)
total_responses_available (this is a database field which equates to quota minus used - we can either calculate this in the code or we can utilize this field and save the value, I'm not sure what is best)
total_responses_quota (this will be updated each month, depending on their Stripe plan)

These values should correspond to "Conversation Plans" in the UI:

total_chat_instance_generations_used 
total_chat_instance_genetations_available
total_chat_instance_genetations_quota 

These values should correspond to "Q&A Messages" in the UI:

total_internal_chat_queries_used 
total_internal_chat_queries_available 
total_internal_chat_queries_quota 




