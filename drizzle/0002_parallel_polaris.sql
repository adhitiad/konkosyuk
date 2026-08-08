ALTER TABLE "properties" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "base_price" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "status" text DEFAULT 'aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "amenities" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_city_idx" ON "properties" USING btree ("city");