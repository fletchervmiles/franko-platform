import { pgTable, text, timestamp, uuid, jsonb, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

export const modalsTable = pgTable("modals", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  name: text("name").notNull(), // Internal label for the modal
  embedSlug: text("embed_slug").notNull(), // Unique slug for /embed/{slug}
  brandSettings: jsonb("brand_settings"), // Stores Interface tab configuration
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => {
  return {
    // Unique constraint on embed_slug for public access
    embedSlugIdx: uniqueIndex("modals_embed_slug_idx").on(table.embedSlug),
    // Index for faster lookup by user
    userIdIdx: index("modals_user_id_idx").on(table.userId),
  };
});

export type InsertModal = typeof modalsTable.$inferInsert;
export type SelectModal = typeof modalsTable.$inferSelect; 