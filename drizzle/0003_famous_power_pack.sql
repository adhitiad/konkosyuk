ALTER TABLE "bookings" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "capacity" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "properties_is_active_idx" ON "properties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_name_unique" UNIQUE("property_id","name");