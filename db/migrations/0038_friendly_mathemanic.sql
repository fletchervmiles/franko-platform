CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_instance_id" uuid NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"secret" text,
	"event_type" varchar(50) DEFAULT 'conversation.completed' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_chat_instance_id_chat_instances_id_fk" FOREIGN KEY ("chat_instance_id") REFERENCES "public"."chat_instances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_chat_instance_id_idx" ON "webhooks" USING btree ("chat_instance_id");