import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getImagesByTag } from "$lib/server/services/gallery"
import {
  getCanonicalTag,
  getLocalizedDisplayName,
  getLocalizedSlug,
} from "$lib/server/services/tagTranslation"
import { getPromptSuggestions } from "$lib/server/services/suggestions"
import { getLocale } from "$lib/paraglide/runtime"
import { type Locale, buildDomainUrl, LOCALE_DOMAIN_MAP } from "$lib/i18n/domains"

export const load: PageServerLoad = async ({ params }) => {
  const locale = getLocale() as Locale
  const urlSlug = params.tag

  // Lookup canonical tag from URL slug
  const canonicalTag = await getCanonicalTag(urlSlug, locale)
  if (!canonicalTag) {
    // Tag not found - return 404
    throw error(404, locale === "de" ? "Tag nicht gefunden" : "Tag not found")
  }

  // Get recent public images for this tag
  const images = await getImagesByTag(canonicalTag, 5)

  // Get display name for the tag
  const displayName = await getLocalizedDisplayName(canonicalTag, locale)

  // Get prompt suggestions for this tag/locale
  const suggestions = await getPromptSuggestions(canonicalTag, locale)

  // Build alternate URLs for hreflang (each locale gets its own localized slug)
  const locales = Object.keys(LOCALE_DOMAIN_MAP) as Locale[]
  const alternateUrls: Record<Locale, string> = {} as Record<Locale, string>
  for (const loc of locales) {
    const localizedSlug = await getLocalizedSlug(canonicalTag, loc)
    alternateUrls[loc] = buildDomainUrl(`/${localizedSlug ?? canonicalTag}`, loc)
  }

  return {
    tag: canonicalTag,
    urlSlug,
    displayName,
    images,
    locale,
    alternateUrls,
    suggestions,
  }
}
