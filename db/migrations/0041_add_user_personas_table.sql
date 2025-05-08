CREATE TABLE IF NOT EXISTS "user_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_user_id" text NOT NULL,
	"persona_name" text NOT NULL,
	"persona_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "organisation_description_demo_only" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_personas" ADD CONSTRAINT "user_personas_profile_user_id_profiles_user_id_fk" FOREIGN KEY ("profile_user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_personas_user_id_name_idx" ON "user_personas" USING btree ("profile_user_id","persona_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_personas_user_id_idx" ON "user_personas" USING btree ("profile_user_id");