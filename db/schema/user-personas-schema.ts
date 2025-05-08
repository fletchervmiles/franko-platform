import { pgTable, text, timestamp, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles-schema";

export const userPersonasTable = pgTable("user_personas", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  profileUserId: text("profile_user_id")
    .notNull()
    .references(() => profilesTable.userId, { onDelete: "cascade" }),
  personaName: text("persona_name").notNull(),
  personaDescription: text("persona_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (table) => {
  return {
    // Unique constraint on user + persona name
    userIdNameIdx: uniqueIndex("user_personas_user_id_name_idx").on(
      table.profileUserId,
      table.personaName
    ),
    // Index for faster lookup by user - SHOULD NOT BE UNIQUE
    userIdIdx: index("user_personas_user_id_idx").on(table.profileUserId),
  };
});

export type InsertUserPersona = typeof userPersonasTable.$inferInsert;
export type SelectUserPersona = typeof userPersonasTable.$inferSelect; 