# Database Schema Updates

## Overview

This document outlines the changes to the database schema as part of the project merge. It details table updates, deletions, and the introduction of new tables. Please follow the instructions carefully to ensure a smooth transition.

## Existing code tables and references

db\schema\conversations-schema.ts
db\schema\profiles-schema.ts
db\schema\schema.ts
db\schema\todos-schema.ts
db\schema\interviews-schema.ts

actions
actions\profiles-actions.ts
actions\stripe-actions.ts
actions\interviews-actions.ts
db\queries\profiles-queries.ts
db\queries\todos-queries.ts

db\queries
db\queries\conversations-queries.ts
db\queries\interviews-queries.ts

## Steps to Implement Changes

1. **Backup Your Database**: Before making any changes, ensure you have a full backup of your database.
2. **Remove Deprecated Tables**: Drop the following tables as they are no longer needed:
   - `todos`
   - `creator_conversations`
   - `reservations`
   - `user` (Ensure that all references to this table in other tables are updated before deleting. User should be replaced by profiles)
3. **Update the `profiles` Table**:
   - Rename columns as specified below.
   - Add new columns.
   - Ensure data migration is handled correctly.
4. **Rename `chat` Table to `chat_instances`**:
   - Ensure that all references to `chat` in your application code and database queries are updated.
   - Add the necessary fields.
5. **Create the `chat_responses` Table**:
   - Ensure it correctly links to `profiles` and `chat_instances`.
   - Implement foreign key constraints for data integrity.
6. **Test the Changes**:
   - Run database migrations in a staging environment before deploying to production.
   - Verify that all queries and application code referencing these tables are working correctly.
   - Perform a data integrity check to ensure all records are correctly updated.

## Updated Profiles Table

This will serve as the main database to identify:
- The user (i.e., `userID`) associated with the account
- Their Stripe/payment subscription
- Their organisation name and descriptions (used to contextualize chat agents)
- Their usage/plan credits

### Schema Changes

Existing here: C:\Users\fletc\Desktop\franko-platform\db\schema\profiles-schema.ts

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
  totalResponsesUsed: integer("total_responses_used").default(0),
  totalResponsesUsedThisMonth: integer("total_responses_used_this_month").default(0),
  totalResponsesAvailable: integer("total_responses_available").default(0),
  monthlyResponsesQuota: integer("monthly_responses_quota").default(0),
  totalChatInstancesUsed: integer("total_chat_instances_used").default(0),
  totalChatInstancesAvailable: integer("total_chat_instances_available").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;
```


## Create Chat Instances Table

This table stores chat instances associated with users from the profiles table.

```typescript
export const chatInstancesTable = pgTable("chat_instances", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id").notNull().references(() => profilesTable.userId),
  messages: text("messages"),
  interviewGuide: text("interview_guide"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
```

## Chat Responses Table

Each response in a chat instance is stored in this table. It links to both the profiles and chat_instances tables.

```typescript
export const chatResponsesTable = pgTable("chat_responses", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id").notNull().references(() => profilesTable.userId),
  chatInstanceId: uuid("chat_instance_id").notNull().references(() => chatInstancesTable.id),
  completionStatus: text("completion_status"),
  status: text("status"),
  intervieweeFirstName: text("interviewee_first_name"),
  intervieweeSecondName: text("interviewee_second_name"),
  intervieweeEmail: text("interviewee_email"),
  interviewStartTime: timestamp("interview_start_time"),
  interviewEndTime: timestamp("interview_end_time"),
  totalInterviewMinutes: integer("total_interview_minutes"),
  messagesJson: text("messages_json"),
  cleanTranscript: text("clean_transcript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
```

## Final Steps

1. Migrate Existing Data:
- Ensure data from the deleted tables is properly migrated to new structures where applicable.
- Map userId from user table to the profiles table.
- Ensure all foreign key relationships are correctly maintained.

2. Review API Endpoints:
- Update backend logic to match the new table structures.
- Modify queries and update any references to renamed columns.

3. Foreign Key Constraints: 
- Ensure that all new foreign key relationships (e.g., linking chat_instances.userId to profiles.userId and chat_responses.chatInstanceId to chat_instances.id) are properly set up and indexed.

4. Consistency in Naming: 
- Make sure that all references (in the database and in your application code) use the updated column names and table names.


## IMPORTANT

Before proceeding with these instructions. 

Ask me 5 clarifying questions.