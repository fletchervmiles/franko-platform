import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";
import { chatInstancesTable } from "./chat-instances-schema";

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  chatInstanceId: uuid('chat_instance_id')
    .notNull()
    .references(() => chatInstancesTable.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  description: text('description'), // Optional description
  secret: text('secret'), // Optional signing secret, stored as plain text initially
  eventType: varchar('event_type', { length: 50 })
    .notNull()
    .default('conversation.completed'), // Default event type
  isActive: boolean('is_active').notNull().default(true), // To enable/disable
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()), // Automatically update timestamp on update
}, (table) => {
  return {
    // Add an index on chatInstanceId for faster lookups
    chatInstanceIdIdx: index('webhook_chat_instance_id_idx').on(table.chatInstanceId),
  };
});

export type Webhook = typeof webhooks.$inferSelect; // Type for selecting webhooks
export type NewWebhook = typeof webhooks.$inferInsert; // Type for inserting new webhooks 