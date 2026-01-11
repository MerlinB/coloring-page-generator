import type { PageServerLoad } from "./$types"
import { getPopularTags } from "$lib/server/services/gallery"
import { getLocalizedTagsBatch } from "$lib/server/services/tagTranslation"
import { getLocale } from "$lib/paraglide/runtime"
import type { Locale } from "$lib/i18n/domains"

export const prerender = false

export const load: PageServerLoad = async () => {
  const locale = getLocale() as Locale

  // Get top 100 popular tags (1 query)
  const popularTags = await getPopularTags(100)

  if (popularTags.length === 0) {
    return { popularTags: [] }
  }

  // Batch lookup all translations in a single query
  const canonicalTags = popularTags.map((t) => t.tagSlug)
  const translationsMap = await getLocalizedTagsBatch(canonicalTags, locale)

  // Map to final format, preserving popularity order
  const localizedTags = popularTags.map(({ tagSlug }) => {
    const translation = translationsMap.get(tagSlug)!
    return {
      slug: translation.slug,
      displayName: translation.displayName,
    }
  })

  return {
    popularTags: localizedTags,
  }
}
