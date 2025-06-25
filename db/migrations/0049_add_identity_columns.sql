-- Add columns for identity verification and external user metadata
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_secret TEXT;

ALTER TABLE chat_responses
  ADD COLUMN IF NOT EXISTS interviewee_user_id TEXT,
  ADD COLUMN IF NOT EXISTS user_metadata JSONB; 