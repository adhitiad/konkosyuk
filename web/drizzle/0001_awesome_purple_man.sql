ALTER TABLE "payments" ADD COLUMN "raw_response" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "event_type" text;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "signature_valid" boolean DEFAULT false;