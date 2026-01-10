CREATE TABLE "gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"prompt" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"flag_reason" text,
	"format" text DEFAULT 'portrait' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"tag_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "image_tags_image_tag_unique" UNIQUE("image_id","tag_slug")
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_slug" text NOT NULL,
	"locale" text NOT NULL,
	"localized_slug" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_translations_tag_locale_unique" UNIQUE("tag_slug","locale")
);
--> statement-breakpoint
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_generation_id_generations_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."generations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_tags" ADD CONSTRAINT "image_tags_image_id_gallery_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."gallery_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_images_public_idx" ON "gallery_images" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "gallery_images_created_at_idx" ON "gallery_images" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_tags_image_idx" ON "image_tags" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "image_tags_slug_idx" ON "image_tags" USING btree ("tag_slug");--> statement-breakpoint
CREATE INDEX "tag_translations_locale_slug_idx" ON "tag_translations" USING btree ("locale","localized_slug");--> statement-breakpoint
CREATE INDEX "tag_translations_tag_slug_idx" ON "tag_translations" USING btree ("tag_slug");