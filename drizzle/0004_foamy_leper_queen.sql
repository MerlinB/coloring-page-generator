DROP INDEX "tag_translations_tag_slug_idx";--> statement-breakpoint
CREATE INDEX "tag_translations_locale_tag_idx" ON "tag_translations" USING btree ("locale","tag_slug");