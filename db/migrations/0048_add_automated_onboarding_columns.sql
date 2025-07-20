-- Migration: Add automated onboarding tracking columns
-- This migration adds columns to track the automated onboarding process

-- Add automated onboarding tracking columns to user_onboarding_status table
ALTER TABLE "user_onboarding_status" 
  ADD COLUMN IF NOT EXISTS "step1_xa_ai_complete" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "step2_context_report_complete" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "step3_brand_fetch_complete" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "step4_conversation_plans_complete" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "step5_modal_created" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "processing_status" varchar(50) DEFAULT 'not_started' NOT NULL,
  ADD COLUMN IF NOT EXISTS "error_message" text,
  ADD COLUMN IF NOT EXISTS "started_at" timestamp,
  ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

-- Add index for faster lookups by processing status
CREATE INDEX IF NOT EXISTS "user_onboarding_status_processing_status_idx" 
  ON "user_onboarding_status" ("processing_status");

-- Add index for faster lookups by started_at for monitoring
CREATE INDEX IF NOT EXISTS "user_onboarding_status_started_at_idx" 
  ON "user_onboarding_status" ("started_at" DESC);

-- Add comment to explain the processing_status values
COMMENT ON COLUMN "user_onboarding_status"."processing_status" IS 'Values: not_started, in_progress, completed, failed'; 