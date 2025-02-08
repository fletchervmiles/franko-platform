CREATE TABLE IF NOT EXISTS "chat_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"messages" text,
	"interview_guide" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"chat_instance_id" uuid NOT NULL,
	"completion_status" text,
	"status" text,
	"interviewee_first_name" text,
	"interviewee_second_name" text,
	"interviewee_email" text,
	"interview_start_time" timestamp,
	"interview_end_time" timestamp,
	"total_interview_minutes" integer,
	"messages_json" text,
	"clean_transcript" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "todos" CASCADE;--> statement-breakpoint
DROP TABLE "interviews" CASCADE;--> statement-breakpoint
DROP TABLE "creator_conversations" CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "company_name" TO "organisation_name";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "company_url" TO "organisation_url";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "company_description" TO "organisation_description";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "company_description_completed" TO "organisation_description_completed";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "minutes_total_used" TO "total_responses_used";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "minutes_used_this_month" TO "total_responses_used_this_month";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "minutes_available" TO "total_responses_available";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "monthly_minutes" TO "monthly_responses_quota";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "total_chat_instances_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "total_chat_instances_available" integer DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_instances" ADD CONSTRAINT "chat_instances_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_responses" ADD CONSTRAINT "chat_responses_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_responses" ADD CONSTRAINT "chat_responses_chat_instance_id_chat_instances_id_fk" FOREIGN KEY ("chat_instance_id") REFERENCES "public"."chat_instances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "agent_interviewer_name";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "voice_id";