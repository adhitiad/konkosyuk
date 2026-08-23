CREATE INDEX properties_is_active_status_type_idx ON "properties" ("is_active", "status", "type");
CREATE INDEX properties_is_active_city_type_idx ON "properties" ("is_active", "city", "type");
CREATE INDEX properties_base_price_idx ON "properties" ("base_price");
CREATE INDEX properties_created_at_idx ON "properties" ("created_at");
CREATE INDEX properties_gps_is_active_location_idx ON "properties" ("gps_verified", "is_active", "latitude", "longitude");
CREATE INDEX properties_owner_id_is_active_idx ON "properties" ("owner_id", "is_active");

CREATE INDEX units_property_id_status_idx ON "units" ("property_id", "status");

CREATE INDEX bookings_user_id_status_created_at_idx ON "bookings" ("user_id", "status", "created_at");
CREATE INDEX bookings_unit_id_status_dates_idx ON "bookings" ("unit_id", "status", "start_date", "end_date");
CREATE INDEX bookings_end_date_idx ON "bookings" ("end_date");

CREATE INDEX payments_status_created_at_idx ON "payments" ("status", "created_at");
CREATE INDEX payments_booking_id_status_idx ON "payments" ("booking_id", "status");

CREATE INDEX reviews_property_id_created_at_idx ON "reviews" ("property_id", "created_at");
CREATE INDEX reviews_reviewed_user_type_created_at_idx ON "reviews" ("reviewed_user_id", "type", "created_at");

CREATE INDEX maintenance_reports_property_id_status_idx ON "maintenance_reports" ("property_id", "status");
