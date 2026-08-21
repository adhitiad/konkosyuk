CREATE TABLE "campus_areas" (
	"campus_area_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campus_area_slug" text NOT NULL,
	"campus_area_name" text NOT NULL,
	"campus_area_image_key" text NOT NULL,
	"campus_area_property_count" integer DEFAULT 0 NOT NULL,
	"campus_area_sort_order" integer DEFAULT 0 NOT NULL,
	"campus_area_is_active" boolean DEFAULT true NOT NULL,
	"campus_area_created_at" timestamp DEFAULT now() NOT NULL,
	"campus_area_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campus_areas_campus_area_slug_unique" UNIQUE("campus_area_slug")
);
--> statement-breakpoint
CREATE TABLE "nearby_places" (
	"nearby_place_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nearby_place_property_id" uuid NOT NULL,
	"nearby_place_name" text NOT NULL,
	"nearby_place_type" text NOT NULL,
	"nearby_place_distance" integer NOT NULL,
	"nearby_place_latitude" numeric(10, 8) NOT NULL,
	"nearby_place_longitude" numeric(10, 8) NOT NULL,
	"nearby_place_sort_order" integer DEFAULT 0 NOT NULL,
	"nearby_place_created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popular_areas" (
	"popular_area_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"popular_area_slug" text NOT NULL,
	"popular_area_name" text NOT NULL,
	"popular_area_image_key" text NOT NULL,
	"popular_area_property_count" integer DEFAULT 0 NOT NULL,
	"popular_area_sort_order" integer DEFAULT 0 NOT NULL,
	"popular_area_is_active" boolean DEFAULT true NOT NULL,
	"popular_area_created_at" timestamp DEFAULT now() NOT NULL,
	"popular_area_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "popular_areas_popular_area_slug_unique" UNIQUE("popular_area_slug")
);
--> statement-breakpoint
CREATE TABLE "property_rules" (
	"property_rules_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_rule_property_id" uuid NOT NULL,
	"property_rule_text" text NOT NULL,
	"property_rule_type" text DEFAULT 'general' NOT NULL,
	"property_rule_sort_order" integer DEFAULT 0 NOT NULL,
	"property_rule_created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_facilities" (
	"room_facility_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_facility_unit_id" uuid NOT NULL,
	"room_facility_category" text NOT NULL,
	"room_facility_name" text NOT NULL,
	"room_facility_icon" text DEFAULT 'circle-dot' NOT NULL,
	"room_facility_sort_order" integer DEFAULT 0 NOT NULL,
	"room_facility_created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_facilities_unit_category_name_unique" UNIQUE("room_facility_unit_id","room_facility_category","room_facility_name")
);
--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "room_size" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "electricity_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "furniture_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nearby_places" ADD CONSTRAINT "nearby_places_nearby_place_property_id_properties_id_fk" FOREIGN KEY ("nearby_place_property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_rules" ADD CONSTRAINT "property_rules_property_rule_property_id_properties_id_fk" FOREIGN KEY ("property_rule_property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_facilities" ADD CONSTRAINT "room_facilities_room_facility_unit_id_units_id_fk" FOREIGN KEY ("room_facility_unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_nearby_places_property" ON "nearby_places" USING btree ("nearby_place_property_id");--> statement-breakpoint
CREATE INDEX "idx_nearby_places_type" ON "nearby_places" USING btree ("nearby_place_type");--> statement-breakpoint
CREATE INDEX "idx_property_rules_property" ON "property_rules" USING btree ("property_rule_property_id");--> statement-breakpoint
CREATE INDEX "idx_room_facilities_unit" ON "room_facilities" USING btree ("room_facility_unit_id");--> statement-breakpoint
CREATE INDEX "idx_room_facilities_category" ON "room_facilities" USING btree ("room_facility_category");