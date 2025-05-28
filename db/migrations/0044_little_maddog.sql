-- CREATE TYPE "public"."pmf_category_enum" AS ENUM('very', 'somewhat', 'not');--> statement-breakpoint
-- CREATE TYPE "public"."sentiment_enum" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
-- CREATE TYPE "public"."signal_level_enum" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
-- ALTER TABLE "chat_responses" RENAME COLUMN "persona" TO "persona_category";--> statement-breakpoint
-- ALTER TABLE "response_fields" RENAME COLUMN "signal" TO "signal_level";--> statement-breakpoint
ALTER TABLE "response_fields" ALTER COLUMN "signal_level" SET DATA TYPE signal_level_enum USING "signal_level"::signal_level_enum;--> statement-breakpoint
ALTER TABLE "chat_responses" ALTER COLUMN "pmf_category" SET DATA TYPE pmf_category_enum USING "pmf_category"::pmf_category_enum;--> statement-breakpoint
-- ALTER TABLE "chat_instances" ADD COLUMN "interview_type" text;--> statement-breakpoint
ALTER TABLE "chat_responses" ADD COLUMN "interview_type" text;--> statement-breakpoint
ALTER TABLE "chat_responses" ADD COLUMN "sentiment" "sentiment_enum";--> statement-breakpoint
ALTER TABLE "chat_responses" ADD COLUMN "characteristics_json" jsonb;