import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getImagesByTag } from "$lib/server/services/gallery"
import {
  getCanonicalTag,
  getLocalizedDisplayName,
} from "$lib/server/services/tagTranslation"
import type { Locale } from "$lib/i18n/domains"

export const load: PageServerLoad = async ({ params }) => {
  const locale: Locale = "en"
  const urlSlug = params.tag

  // Lookup canonical tag from URL slug
  const canonicalTag = await getCanonicalTag(urlSlug, locale)
  if (!canonicalTag) {
    // Tag not found - return 404
    throw error(404, "Tag not found")
  }

  // Get recent public images for this tag
  const images = await getImagesByTag(canonicalTag, 5)

  // Get display name for the tag
  const displayName = await getLocalizedDisplayName(canonicalTag, locale)

  return {
    tag: canonicalTag,
    urlSlug,
    displayName,
    images,
    locale,
  }
}
