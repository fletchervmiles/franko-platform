-- Rename column and change type
ALTER TABLE "chat_instances" 
  -- First drop the existing column (since we don't need to preserve data)
  DROP COLUMN IF EXISTS "interview_guide",
  -- Add the new JSONB column
  ADD COLUMN "conversation_plan" jsonb,
  -- Add last edited timestamp
  ADD COLUMN "conversation_plan_last_edited" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN "chat_instances"."conversation_plan" IS 'Stores the conversation plan structure as JSONB';
COMMENT ON COLUMN "chat_instances"."conversation_plan_last_edited" IS 'Timestamp of when the conversation plan was last modified'; 