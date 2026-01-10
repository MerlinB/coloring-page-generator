import { type Locale, getDomainForLocale } from "./domains"

/**
 * Gallery route prefixes for each locale.
 * These form the first part of the URL path for gallery pages.
 */
export const GALLERY_PREFIXES: Record<Locale, string> = {
  en: "coloring-pages",
  de: "ausmalbilder",
}

/**
 * Build the gallery path for a tag in a specific locale.
 * @example getGalleryPath("dinosaur", "en") => "/coloring-pages/dinosaur"
 * @example getGalleryPath("dinosaurier", "de") => "/ausmalbilder/dinosaurier"
 */
export function getGalleryPath(tagSlug: string, locale: Locale): string {
  return `/${GALLERY_PREFIXES[locale]}/${tagSlug}`
}

/**
 * Build a full gallery URL for a tag in a specific locale.
 * @example getGalleryUrl("dinosaur", "en") => "https://www.makecoloringpages.com/coloring-pages/dinosaur"
 */
export function getGalleryUrl(tagSlug: string, locale: Locale): string {
  const domain = getDomainForLocale(locale)
  return `${domain}${getGalleryPath(tagSlug, locale)}`
}
