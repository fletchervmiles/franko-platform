-- Drop both columns to start fresh
ALTER TABLE "chat_instances" DROP COLUMN IF EXISTS "interview_guide";
ALTER TABLE "chat_instances" DROP COLUMN IF EXISTS "conversation_plan";
ALTER TABLE "chat_instances" DROP COLUMN IF EXISTS "conversation_plan_last_edited";

-- Add the columns back with correct types
ALTER TABLE "chat_instances" 
    ADD COLUMN "conversation_plan" JSONB,
    ADD COLUMN "conversation_plan_last_edited" timestamp DEFAULT now() NOT NULL;

-- Add comments to explain the columns
COMMENT ON COLUMN "chat_instances"."conversation_plan" IS 'Stores the conversation plan structure as JSONB';
COMMENT ON COLUMN "chat_instances"."conversation_plan_last_edited" IS 'Timestamp of when the conversation plan was last modified';