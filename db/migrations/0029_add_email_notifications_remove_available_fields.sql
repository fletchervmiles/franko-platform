-- Add response_email_notifications field to chat_instances
ALTER TABLE "chat_instances" ADD COLUMN "response_email_notifications" boolean DEFAULT false;

-- Remove unused 'available' fields from profiles
ALTER TABLE "profiles" DROP COLUMN "total_chat_instance_generations_available";
ALTER TABLE "profiles" DROP COLUMN "total_internal_chat_queries_available";
ALTER TABLE "profiles" DROP COLUMN "total_responses_available"; 