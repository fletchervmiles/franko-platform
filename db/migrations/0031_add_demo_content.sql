ALTER TABLE "chat_instances" ADD COLUMN "demo_content" boolean DEFAULT false;

-- Add demo_content to the schema type
ALTER TABLE "chat_instances" ALTER COLUMN "demo_content" SET NOT NULL; 