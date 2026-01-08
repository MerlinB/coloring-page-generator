CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"week_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"redemption_code_id" uuid,
	"prompt" text NOT NULL,
	"was_free_tier" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"email" text,
	"pack_type" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"refunded_amount_cents" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "redemption_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"initial_tokens" integer NOT NULL,
	"remaining_tokens" integer NOT NULL,
	"purchase_id" uuid,
	"redeemed_by_fingerprint" text,
	"redeemed_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redemption_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_redemption_code_id_redemption_codes_id_fk" FOREIGN KEY ("redemption_code_id") REFERENCES "public"."redemption_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption_codes" ADD CONSTRAINT "redemption_codes_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devices_fingerprint_idx" ON "devices" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "generations_fingerprint_idx" ON "generations" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "generations_created_at_idx" ON "generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "purchases_session_idx" ON "purchases" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "purchases_payment_intent_idx" ON "purchases" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "redemption_codes_code_idx" ON "redemption_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "redemption_codes_fingerprint_idx" ON "redemption_codes" USING btree ("redeemed_by_fingerprint");