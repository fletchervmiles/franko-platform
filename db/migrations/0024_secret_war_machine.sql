ALTER TABLE "profiles" RENAME COLUMN "total_responses_used_this_month" TO "total_responses_quota";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "total_responses_used" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "total_internal_chat_queries_quota" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "total_internal_chat_queries_available" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "total_chat_instance_generations_quota" integer DEFAULT 0;