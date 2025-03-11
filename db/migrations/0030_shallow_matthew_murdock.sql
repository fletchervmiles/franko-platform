ALTER TABLE "chat_instances" ADD COLUMN "response_email_notifications" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "response_email_notifications";