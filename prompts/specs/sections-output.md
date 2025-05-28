Database-only Implementation Spec  
(covering everything you still need after A-1/2/3 are finished)

==============================================================

Scope  
Create the remaining persistent structures that power insight-card caching and fast queries.  No worker logic or API code is included here—just the database layer and the Drizzle ORM definitions / migrations.

--------------------------------------------------
1. Objects to Build
--------------------------------------------------

A. `section_outputs` summary cache (MANDATORY)  
B. `refresh_queue` coordination table
C. Additional indexes for fast filtering  

--------------------------------------------------
2. Conventions & Tools
--------------------------------------------------

• Drizzle-ORM migrations (`drizzle-kit generate:pg && drizzle-kit push:pg`)  
• All enum types were created in A-1 (`pmf_response`, `interview_type`, `sentiment`, `signal_level`).

--------------------------------------------------
3. Detailed Steps
--------------------------------------------------

----------------------------------------------------------------
Step 1 — `section_outputs` Table
----------------------------------------------------------------
Purpose Durable cache of the 8 card texts (+ roadmap JSON) per scope.

Drizzle schema (put in `/db/schema/section-outputs.ts`)
```ts
import { pgTable, text, timestamp, jsonb, uuid, integer } from "drizzle-orm/pg-core";

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
  uniqIdx: t.uniqueIndex("section_outputs_uniq")
           .on(t.viewScope, t.scopeKey, t.sectionName)
}));
```

SQL that the migration will run (Drizzle generates for you):
```sql
CREATE TABLE section_outputs (...);
CREATE UNIQUE INDEX section_outputs_uniq
  ON section_outputs(view_scope, scope_key, section_name);
```

----------------------------------------------------------------
Step 2 — `refresh_queue`
----------------------------------------------------------------
Skip entirely for MVP.  If you want it:

```ts
export const refreshQueueTable = pgTable("refresh_queue", {
  scopeType: text("scope_type").notNull(),   // 'persona' | 'pmf'
  scopeKey:  text("scope_key").notNull(),
  queuedAt:  timestamp("queued_at").defaultNow().notNull(),
}, (t) => ({
  pk: t.primaryKey().on(t.scopeType, t.scopeKey)
}));
```

----------------------------------------------------------------
Step 3 — Performance Indexes
----------------------------------------------------------------
Add statements to the same migration file (if not created earlier).

```sql
-- Persona filter
CREATE INDEX ix_chat_persona
  ON chat_responses(persona_category);

-- PMF tier filter
CREATE INDEX ix_chat_pmf
  ON chat_responses(pmf_response);

-- Interview-type filter (needed for churn-saver badge)
CREATE INDEX ix_chat_type
  ON chat_responses(interview_type);

-- Evidence bubble ordering
CREATE INDEX ix_field_key_sig
  ON response_fields(field_key, signal);

-- Fast lookup of cached summaries for a page
CREATE INDEX ix_section_scope
  ON section_outputs(view_scope, scope_key);
```

In Drizzle’s migration file you can embed raw SQL:
```ts
await sql`CREATE INDEX ix_chat_pmf ON chat_responses(pmf_response);`;
```


----------------------------------------------------------------
Step 4 — Run Migrations
----------------------------------------------------------------
1. Generate
```
npx drizzle-kit generate:pg add-section-cache
```
2. Review generated SQL.  
3. Push to dev DB:
```
npm drizzle-kit push:pg
```
4. Repeat on staging → production.


--------------------------------------------------
5. Deliverables
--------------------------------------------------
• `/db/schema/section-outputs.ts`  
• (optional) `/db/schema/refresh-queue.ts`  
• Generated migration SQL containing:  
  – `CREATE TABLE section_outputs`  
  – indexes listed above  
  – column rename if needed  
• README snippet explaining “how to revert” in case of problems.

Once these items are in the code-base your database layer is 100 % ready for the worker and API pieces.