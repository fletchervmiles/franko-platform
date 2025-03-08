-- Create indexes for better query performance on internal chat sessions
CREATE INDEX IF NOT EXISTS "internal_chat_sessions_user_id_idx" ON "internal_chat_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "internal_chat_sessions_updated_at_idx" ON "internal_chat_sessions" ("updated_at" DESC);