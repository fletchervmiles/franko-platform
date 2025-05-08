DROP INDEX IF EXISTS "user_personas_user_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_personas_user_id_idx" ON "user_personas" USING btree ("profile_user_id");