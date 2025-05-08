CREATE TABLE IF NOT EXISTS "user_onboarding_status" (
	"user_id" text PRIMARY KEY NOT NULL,
	"step1_context_complete" boolean DEFAULT false NOT NULL,
	"step2_branding_complete" boolean DEFAULT false NOT NULL,
	"step3_personas_reviewed" boolean DEFAULT false NOT NULL,
	"step4_agent_created" boolean DEFAULT false NOT NULL,
	"step5_link_shared" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_onboarding_status" ADD CONSTRAINT "user_onboarding_status_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
