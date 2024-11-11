ALTER TABLE "profiles" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "company_name" text;