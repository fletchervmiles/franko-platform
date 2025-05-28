import { pgTable, text, timestamp, jsonb, uuid, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const sectionOutputsTable = pgTable("section_outputs", {
  id:            uuid("id").defaultRandom().notNull().primaryKey(),

  viewScope:     text("view_scope").notNull(),         // 'persona' | 'pmf'
  scopeKey:      text("scope_key").notNull(),          // e.g. 'Founder' or 'very'
  sectionName:   text("section_name").notNull(),       // 'who','discovery',…,'roadmap'

  summaryText:   text("summary_text").notNull(),       // 40-70 words
  rankedJson:    jsonb("ranked_json"),                 // roadmap only
  sourceCount:   integer("source_count").notNull(),    // interviews used
  refreshToken:  text("refresh_token").notNull(),      // SHA-1 of id list
  modelVersion:  text("model_version").notNull(),      // 'gpt-4o-2024-05-12'
  generatedAt:   timestamp("generated_at").defaultNow().notNull(),
}, (t) => ({
  uniqIdx: uniqueIndex("section_outputs_uniq")
           .on(t.viewScope, t.scopeKey, t.sectionName)
})); 