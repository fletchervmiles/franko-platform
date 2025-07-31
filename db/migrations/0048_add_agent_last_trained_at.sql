-- Add agent_last_trained_at column to profiles table
ALTER TABLE "profiles" ADD COLUMN "agent_last_trained_at" timestamp;

-- Add comment to explain the column
COMMENT ON COLUMN "profiles"."agent_last_trained_at" IS 'Timestamp when agents were last trained/retrained. Used to track if agents need retraining after context changes.';