CREATE TABLE IF NOT EXISTS "response_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"distilled_text" text,
	"snippet" text,
	"signal" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "response_array_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"array_key" text NOT NULL,
	"value" text
);
--> statement-breakpoint
ALTER TABLE "chat_responses" ADD COLUMN "persona" text DEFAULT 'UNCLASSIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_responses" ADD COLUMN "pmf_category" text;--> statement-breakpoint
ALTER TABLE "chat_responses" ADD COLUMN "extraction_json" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "response_fields" ADD CONSTRAINT "response_fields_response_id_chat_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."chat_responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "response_array_items" ADD CONSTRAINT "response_array_items_response_id_chat_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."chat_responses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
