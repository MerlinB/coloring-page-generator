import { type Locale, getDomainForLocale } from "./domains"

/**
 * Build the gallery path for a tag.
 * Tags are now at the root level (no prefix).
 * @example getGalleryPath("dinosaur") => "/dinosaur"
 */
export function getGalleryPath(tagSlug: string): string {
  return `/${tagSlug}`
}

/**
 * Build a full gallery URL for a tag in a specific locale.
 * @example getGalleryUrl("dinosaur", "en") => "https://www.makecoloringpages.com/dinosaur"
 */
export function getGalleryUrl(tagSlug: string, locale: Locale): string {
  const domain = getDomainForLocale(locale)
  return `${domain}${getGalleryPath(tagSlug)}`
}
