CREATE TABLE "property_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"advertiser_name" text NOT NULL,
	"advertiser_phone" text NOT NULL,
	"advertiser_whatsapp" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"target_url" text,
	"location" text NOT NULL,
	"price" text,
	"type" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_ads" ADD CONSTRAINT "property_ads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_property_ads_active" ON "property_ads" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_property_ads_dates" ON "property_ads" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_property_ads_position" ON "property_ads" USING btree ("position");