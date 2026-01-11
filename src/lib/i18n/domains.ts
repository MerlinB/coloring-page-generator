/**
 * Locale configuration and domain mappings for i18n.
 *
 * This is the SINGLE SOURCE OF TRUTH for supported locales.
 * When adding a new locale:
 * 1. Add it to SUPPORTED_LOCALES below
 * 2. Add domain mapping in DOMAIN_LOCALE_MAP and LOCALE_DOMAIN_MAP
 * 3. Update project.inlang/settings.json to match
 * 4. Create messages/<locale>.json translation file
 */

/** All supported locales. This is the canonical source - other files import from here. */
export const SUPPORTED_LOCALES = ["en", "de", "fr", "es"] as const

/** Locale type derived from SUPPORTED_LOCALES */
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** Base locale used for canonical content and fallbacks */
export const BASE_LOCALE: Locale = "en"

export const DOMAIN_LOCALE_MAP: Record<string, Locale> = {
  // English domains
  "makecoloringpages.com": "en",
  "www.makecoloringpages.com": "en",
  // German domains
  "ausmalbilder-generator.de": "de",
  "www.ausmalbilder-generator.de": "de",
  // French domains
  "generateurcoloriages.com": "fr",
  "www.generateurcoloriages.com": "fr",
  // Spanish domains
  "generadordibujoscolorear.com": "es",
  "www.generadordibujoscolorear.com": "es",
  // Development
  localhost: "en",
}

export const LOCALE_DOMAIN_MAP: Record<Locale, string> = {
  en: "https://www.makecoloringpages.com",
  de: "https://www.ausmalbilder-generator.de",
  fr: "https://www.generateurcoloriages.com",
  es: "https://www.generadordibujoscolorear.com",
}

/**
 * Get the locale for a given hostname.
 * Falls back to BASE_LOCALE if hostname is not mapped.
 */
export function getLocaleFromHostname(hostname: string): Locale {
  // Strip port number if present (e.g., localhost:5173)
  const host = hostname.split(":")[0]
  return DOMAIN_LOCALE_MAP[host] ?? BASE_LOCALE
}

/**
 * Get the full domain URL for a given locale.
 */
export function getDomainForLocale(locale: Locale): string {
  return LOCALE_DOMAIN_MAP[locale]
}

/**
 * Build a full URL for a given path and locale.
 */
export function buildDomainUrl(pathname: string, locale: Locale): string {
  const domain = getDomainForLocale(locale)
  return `${domain}${pathname}`
}
