ALTER TABLE "profiles" ALTER COLUMN "total_responses_used" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "monthly_responses_quota";