CREATE TABLE IF NOT EXISTS "section_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"view_scope" text NOT NULL,
	"scope_key" text NOT NULL,
	"section_name" text NOT NULL,
	"summary_text" text NOT NULL,
	"ranked_json" jsonb,
	"source_count" integer NOT NULL,
	"refresh_token" text NOT NULL,
	"model_version" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "section_outputs_uniq" ON "section_outputs" USING btree ("view_scope","scope_key","section_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_chat_persona" ON "chat_responses"("persona_category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_chat_pmf" ON "chat_responses"("pmf_response");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_chat_type" ON "chat_responses"("interview_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ix_field_key_sig" ON "response_fields"("field_key", "signal");