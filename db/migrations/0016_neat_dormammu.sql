ALTER TABLE "chat_instances" ADD COLUMN "topic" text;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "duration" text;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "respondent_contacts" boolean;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "incentive_status" boolean;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "incentive_code" text;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "incentive_description" text;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "additional_details" text;--> statement-breakpoint
ALTER TABLE "chat_instances" ADD COLUMN "published" boolean DEFAULT false;