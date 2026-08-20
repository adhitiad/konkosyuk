CREATE TABLE "loyalty_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"reference_id" uuid,
	"reference_type" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"email_digest" text DEFAULT 'immediate' NOT NULL,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_code_unique";--> statement-breakpoint
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referrer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referee_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "reward_redemptions" DROP CONSTRAINT "reward_redemptions_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "reward_redemptions" DROP CONSTRAINT "reward_redemptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "reward_redemptions" DROP CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk";
--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "referee_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ALTER COLUMN "value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rewards" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "category" text DEFAULT 'tenant' NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "property_id" uuid;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "base_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "commission_rate" numeric(5, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "commission_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referee_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "eligible_at" timestamp;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "payout_scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "voucher_code" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "offset_applied" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "tier" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "loyalty_transactions_user_id_idx" ON "loyalty_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_notification_preferences_user_id_idx" ON "user_notification_preferences" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "referrals_referrer_id_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "referrals_referee_id_idx" ON "referrals" USING btree ("referee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_code_idx" ON "referrals" USING btree ("code");--> statement-breakpoint
CREATE INDEX "reward_redemptions_user_id_idx" ON "reward_redemptions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "referrals" DROP COLUMN "reward_points";--> statement-breakpoint
ALTER TABLE "reward_redemptions" DROP COLUMN "booking_id";--> statement-breakpoint
ALTER TABLE "reward_redemptions" DROP COLUMN "used_at";--> statement-breakpoint
ALTER TABLE "rewards" DROP COLUMN "type";