-- Migration: Add modal-related columns to existing tables
-- This migration adds the necessary columns to support multi-agent modal functionality

-- Add modal-related columns to chat_instances table
ALTER TABLE "chat_instances" ADD COLUMN IF NOT EXISTS "modal_id" uuid;
ALTER TABLE "chat_instances" ADD COLUMN IF NOT EXISTS "agent_type" varchar(50);
ALTER TABLE "chat_instances" ADD COLUMN IF NOT EXISTS "is_enabled" boolean DEFAULT true;
ALTER TABLE "chat_instances" ADD COLUMN IF NOT EXISTS "is_modal_agent" boolean DEFAULT false;

-- Add foreign key constraint for modal_id
DO $$ BEGIN
 ALTER TABLE "chat_instances" ADD CONSTRAINT "chat_instances_modal_id_modals_id_fk" FOREIGN KEY ("modal_id") REFERENCES "public"."modals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add agent_type column to chat_responses table for analytics
ALTER TABLE "chat_responses" ADD COLUMN IF NOT EXISTS "agent_type" varchar(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "chat_instances_modal_id_idx" ON "chat_instances" USING btree ("modal_id");
CREATE INDEX IF NOT EXISTS "chat_instances_agent_type_idx" ON "chat_instances" USING btree ("agent_type");
CREATE INDEX IF NOT EXISTS "chat_responses_agent_type_idx" ON "chat_responses" USING btree ("agent_type");

-- Back-fill existing data to ensure consistency
-- Set is_modal_agent = false for all existing chat instances (they are legacy single links)
-- Set is_enabled = true for all existing chat instances (default behavior)
UPDATE "chat_instances" 
SET 
  "is_modal_agent" = false,
  "is_enabled" = true
WHERE 
  "is_modal_agent" IS NULL 
  OR "is_enabled" IS NULL; 