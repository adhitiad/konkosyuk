CREATE TABLE "payment_gateway_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway_id" text NOT NULL,
	"encrypted_config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_gateway_credentials_gateway_id_unique" UNIQUE("gateway_id")
);
--> statement-breakpoint
ALTER TABLE "payment_gateway_credentials" ADD CONSTRAINT "payment_gateway_credentials_gateway_id_payment_gateway_configs_id_fk" FOREIGN KEY ("gateway_id") REFERENCES "public"."payment_gateway_configs"("id") ON DELETE cascade ON UPDATE no action;