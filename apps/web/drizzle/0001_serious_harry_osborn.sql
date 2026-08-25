ALTER TABLE "loyalty_points" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "loyalty_points" CASCADE;--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_group_booking_id_group_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "group_booking_members" DROP CONSTRAINT "group_booking_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "group_booking_members" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "base_price" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "refund_requests" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "refund_requests" ALTER COLUMN "approved_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "voucher_redeemed_at" timestamp;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "offset_consumed_at" timestamp;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "payout_idempotency_key" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_group_booking_id_group_bookings_id_fk" FOREIGN KEY ("group_booking_id") REFERENCES "public"."group_bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_booking_members" ADD CONSTRAINT "group_booking_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_transaction_id_payments_id_fk" FOREIGN KEY ("referee_transaction_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_property_availability_idx" ON "bookings" USING btree ("property_id","status","start_date","end_date");--> statement-breakpoint
CREATE INDEX "bookings_group_booking_id_idx" ON "bookings" USING btree ("group_booking_id");--> statement-breakpoint
CREATE INDEX "bookings_is_group_booking_idx" ON "bookings" USING btree ("is_group_booking");--> statement-breakpoint
CREATE INDEX "group_booking_members_status_idx" ON "group_booking_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "group_booking_members_group_booking_id_idx" ON "group_booking_members" USING btree ("group_booking_id");--> statement-breakpoint
CREATE INDEX "group_bookings_lead_user_id_idx" ON "group_bookings" USING btree ("lead_user_id");--> statement-breakpoint
CREATE INDEX "group_bookings_status_idx" ON "group_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "group_bookings_property_id_idx" ON "group_bookings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "group_bookings_created_at_idx" ON "group_bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "loyalty_transactions_type_idx" ON "loyalty_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "loyalty_transactions_expires_at_idx" ON "loyalty_transactions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payments_property_status_paidat_idx" ON "payments" USING btree ("property_id","status","paid_at");--> statement-breakpoint
CREATE INDEX "idx_properties_city_active" ON "properties" USING btree ("city","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_voucher_code_idx" ON "referrals" USING btree ("voucher_code");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_payout_idempotency_key_idx" ON "referrals" USING btree ("payout_idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_referrer_referee_category_unique" ON "referrals" USING btree ("referrer_id","referee_id","category");--> statement-breakpoint
CREATE INDEX "reward_redemptions_status_idx" ON "reward_redemptions" USING btree ("status");--> statement-breakpoint
ALTER TABLE "group_booking_members" ADD CONSTRAINT "group_booking_members_group_booking_id_user_id_unique" UNIQUE("group_booking_id","user_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id");--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_voucher_code_unique" UNIQUE("voucher_code");--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_payout_idempotency_key_unique" UNIQUE("payout_idempotency_key");--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_reward_unique" UNIQUE("user_id","reward_id");