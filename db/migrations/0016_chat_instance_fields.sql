-- Add new fields to chat_instances table
ALTER TABLE "chat_instances" ADD COLUMN "topic" text;
ALTER TABLE "chat_instances" ADD COLUMN "duration" text;
ALTER TABLE "chat_instances" ADD COLUMN "respondent_contacts" boolean;
ALTER TABLE "chat_instances" ADD COLUMN "incentive_status" boolean;
ALTER TABLE "chat_instances" ADD COLUMN "incentive_code" text;
ALTER TABLE "chat_instances" ADD COLUMN "incentive_description" text;
ALTER TABLE "chat_instances" ADD COLUMN "additional_details" text;
ALTER TABLE "chat_instances" ADD COLUMN "published" boolean DEFAULT false; 