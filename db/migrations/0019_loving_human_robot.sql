ALTER TABLE "chat_responses" ALTER COLUMN "chat_progress" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "welcome_description" text;