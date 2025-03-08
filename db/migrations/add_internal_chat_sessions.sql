-- Add internal chat sessions table
CREATE TABLE IF NOT EXISTS "internal_chat_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "profiles"("user_id"),
  "title" TEXT NOT NULL,
  "messages_json" JSONB,
  "selected_responses" JSONB,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- Add total internal chat queries used column to profiles table
ALTER TABLE "profiles" 
ADD COLUMN IF NOT EXISTS "total_internal_chat_queries_used" INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "internal_chat_sessions_user_id_idx" ON "internal_chat_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "internal_chat_sessions_updated_at_idx" ON "internal_chat_sessions" ("updated_at" DESC);