ALTER TABLE "profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "second_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "company_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "company_description" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "company_description_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "minutes_total_used" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "minutes_used_this_month" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "minutes_available" integer DEFAULT 0;