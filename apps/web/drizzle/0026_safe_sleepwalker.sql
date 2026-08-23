CREATE TABLE "ad_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"tier" text NOT NULL,
	"duration" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"position_type" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_packages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "property_ads" ADD COLUMN "package_id" uuid;--> statement-breakpoint
ALTER TABLE "property_ads" ADD COLUMN "payment_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "property_ads" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "property_ads" ADD COLUMN "admin_note" text;--> statement-breakpoint
CREATE INDEX "idx_ad_packages_tier" ON "ad_packages" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_ad_packages_active" ON "ad_packages" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "property_ads" ADD CONSTRAINT "property_ads_package_id_ad_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."ad_packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_property_ads_payment_status" ON "property_ads" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_property_ads_paid_at" ON "property_ads" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "idx_property_ads_package_id" ON "property_ads" USING btree ("package_id");