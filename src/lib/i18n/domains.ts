/**
 * Domain-to-locale mappings for i18n.
 * Each domain serves content in exactly one language.
 */

export type Locale = "en" | "de"

export const DOMAIN_LOCALE_MAP: Record<string, Locale> = {
  // English domains
  "makecoloringpages.com": "en",
  "www.makecoloringpages.com": "en",
  // German domains
  "ausmalbilder-generator.de": "de",
  "www.ausmalbilder-generator.de": "de",
  // Development
  localhost: "en",
}

export const LOCALE_DOMAIN_MAP: Record<Locale, string> = {
  en: "https://www.makecoloringpages.com",
  de: "https://www.ausmalbilder-generator.de",
}

/**
 * Get the locale for a given hostname.
 * Falls back to 'en' if hostname is not mapped.
 */
export function getLocaleFromHostname(hostname: string): Locale {
  // Strip port number if present (e.g., localhost:5173)
  const host = hostname.split(":")[0]
  return DOMAIN_LOCALE_MAP[host] ?? "en"
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
