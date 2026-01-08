CREATE TYPE "public"."code_status" AS ENUM('pending', 'active');--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "redemption_codes" ADD COLUMN "status" "code_status" DEFAULT 'pending' NOT NULL;