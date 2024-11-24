# Account Management

## Objective

The service tracks account usage based on minutes. Each interview in the system represents a specific duration in minutes, and the total of these durations reflects the customer's usage on their profile.

Key features to implement:

Total Minutes Used: Display the total minutes used across the entire service lifetime.
Monthly Allocation: Show the customer's allocated minutes as part of their monthly subscription.
This allocation resets at the start of each month.
Usage and Remaining Minutes: Calculate and display the minutes used and the remaining minutes for the current month.
This system will provide a clear overview of the customer's usage and subscription status.

## Step 1

Review the way the two main tables are set up. 

The profiles table will have all of the account management details

Profiles Schema

`db\schema\profiles-schema.ts`

```typescript
import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "starter", "pro"]);

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().notNull(),
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  companyName: text("company_name"),
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
  monthlyMinutes: integer("monthly_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  agentInterviewerName: text("agent_interviewer_name"),
  voiceId: text("voice_id")
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;
```

Interviews Schema

`db\schema\interviews-schema.ts`

```typescript
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
```

## Step 2

What's the best way to implement this?

Perhaps calculate usage dynamically?

Instead of storing aggregate minute values in the profilesTable, calculate them dynamically from the interviewsTable when needed. This ensures accuracy and reduces redundancy.

Thoughts?