CREATE TABLE IF NOT EXISTS "internal_chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"messages_json" jsonb,
	"selected_responses" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "total_internal_chat_queries_used" integer DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "internal_chat_sessions" ADD CONSTRAINT "internal_chat_sessions_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
