ALTER TABLE "profiles" ADD COLUMN "organisation_description_demo_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chat_instances" DROP COLUMN IF EXISTS "demo_content";