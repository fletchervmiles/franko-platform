-- First, drop the conflicting column if it exists
-- ALTER TABLE "profiles" DROP COLUMN IF EXISTS "organisation_description_demo_only";

-- Then add our new column
ALTER TABLE chat_instances
ADD COLUMN IF NOT EXISTS interview_classification text; 