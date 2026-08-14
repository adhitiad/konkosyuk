CREATE TABLE "kyc_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"didit_session_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_type" text,
	"ktp_image_url" text,
	"selfie_image_url" text,
	"face_match_score" numeric(5, 2),
	"liveness_passed" boolean,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kyc_verifications_didit_session_id_unique" UNIQUE("didit_session_id")
);
--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kyc_verifications_user_id_idx" ON "kyc_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kyc_verifications_didit_session_id_idx" ON "kyc_verifications" USING btree ("didit_session_id");--> statement-breakpoint
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications" USING btree ("status");