-- Migration: Add modals table for multi-agent modal widgets
-- This migration creates the new modals table to store widget configuration and branding

CREATE TABLE IF NOT EXISTS "modals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"embed_slug" text NOT NULL,
	"brand_settings" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "modals" ADD CONSTRAINT "modals_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create unique index on embed_slug for public access
CREATE UNIQUE INDEX IF NOT EXISTS "modals_embed_slug_idx" ON "modals" USING btree ("embed_slug");

-- Create index for faster lookup by user
CREATE INDEX IF NOT EXISTS "modals_user_id_idx" ON "modals" USING btree ("user_id");

-- Create trigger for updated_at timestamp (reuse existing function)
CREATE TRIGGER update_modals_updated_at
    BEFORE UPDATE ON modals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 