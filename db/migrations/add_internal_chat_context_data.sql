-- Add context_data column to internal_chat_sessions table
ALTER TABLE internal_chat_sessions ADD COLUMN IF NOT EXISTS context_data TEXT;