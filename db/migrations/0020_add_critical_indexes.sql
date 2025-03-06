-- Migration: 0020_add_critical_indexes

-- Create indexes for better query performance
-- Up Migration
CREATE INDEX IF NOT EXISTS "idx_chat_instances_user_id" ON "chat_instances" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_chat_responses_chat_instance_id" ON "chat_responses" ("chat_instance_id");
CREATE INDEX IF NOT EXISTS "idx_chat_responses_user_id" ON "chat_responses" ("user_id");

-- Adding index for frequently queried timestamp fields to improve sort operations
CREATE INDEX IF NOT EXISTS "idx_chat_instances_created_at" ON "chat_instances" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_chat_instances_updated_at" ON "chat_instances" ("updated_at");
CREATE INDEX IF NOT EXISTS "idx_chat_responses_created_at" ON "chat_responses" ("created_at");

-- Down Migration
DROP INDEX IF EXISTS "idx_chat_instances_user_id";
DROP INDEX IF EXISTS "idx_chat_responses_chat_instance_id";
DROP INDEX IF EXISTS "idx_chat_responses_user_id";
DROP INDEX IF EXISTS "idx_chat_instances_created_at";
DROP INDEX IF EXISTS "idx_chat_instances_updated_at";
DROP INDEX IF EXISTS "idx_chat_responses_created_at";