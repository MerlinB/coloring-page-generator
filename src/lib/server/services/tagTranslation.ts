import { GoogleGenAI, Type } from "@google/genai"
import { GEMINI_API_KEY } from "$env/static/private"
import { db } from "$lib/server/db"
import { tagTranslations } from "$lib/server/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { SUPPORTED_LOCALES, BASE_LOCALE, type Locale } from "$lib/i18n/domains"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const MODEL = "gemini-2.5-flash"

// Locale display names for LLM prompts
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "German",
  fr: "French",
}

/**
 * Lookup the canonical English tag from a localized slug.
 * Returns null if not found.
 */
export async function getCanonicalTag(
  localizedSlug: string,
  locale: Locale,
): Promise<string | null> {
  const slug = localizedSlug.toLowerCase()

  // First, try to find by localized slug
  const result = await db
    .select({ tagSlug: tagTranslations.tagSlug })
    .from(tagTranslations)
    .where(
      and(
        eq(tagTranslations.localizedSlug, slug),
        eq(tagTranslations.locale, locale),
      ),
    )
    .limit(1)

  if (result.length > 0) {
    return result[0].tagSlug
  }

  // For base locale, also check if the slug matches a canonical tagSlug directly
  // (in case the translation record doesn't exist or has a different localizedSlug)
  if (locale === BASE_LOCALE) {
    const directMatch = await db
      .select({ tagSlug: tagTranslations.tagSlug })
      .from(tagTranslations)
      .where(eq(tagTranslations.tagSlug, slug))
      .limit(1)

    if (directMatch.length > 0) {
      return directMatch[0].tagSlug
    }
  }

  return null
}

/**
 * Get the localized slug for a canonical tag.
 * Returns null if not found.
 */
export async function getLocalizedSlug(
  canonicalTag: string,
  locale: Locale,
): Promise<string | null> {
  const result = await db.query.tagTranslations.findFirst({
    where: and(
      eq(tagTranslations.tagSlug, canonicalTag),
      eq(tagTranslations.locale, locale),
    ),
  })

  return result?.localizedSlug ?? null
}

/**
 * Get the display name for a canonical tag in a specific locale.
 * Returns the tag itself if not found.
 */
export async function getLocalizedDisplayName(
  canonicalTag: string,
  locale: Locale,
): Promise<string> {
  const result = await db.query.tagTranslations.findFirst({
    where: and(
      eq(tagTranslations.tagSlug, canonicalTag),
      eq(tagTranslations.locale, locale),
    ),
  })

  return result?.displayName ?? canonicalTag
}

interface TagTranslation {
  locale: string
  slug: string
  displayName: string
}

/**
 * Use LLM to translate a tag to all supported locales.
 */
async function translateTagWithLLM(
  canonicalTag: string,
): Promise<TagTranslation[]> {
  const localeList = SUPPORTED_LOCALES.map(
    (l) => `${l} (${LOCALE_NAMES[l]})`,
  ).join(", ")

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Translate this English tag for a coloring page gallery into other languages.

Tag to translate: "${canonicalTag}"

Languages needed: ${localeList}

For each language, provide:
- slug: URL-safe lowercase version (no spaces, use hyphens if needed)
- displayName: Human-readable capitalized version

The English version should keep the original tag as-is.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              locale: {
                type: Type.STRING,
                description: "Locale code (en, de)",
              },
              slug: {
                type: Type.STRING,
                description: "URL-safe lowercase slug",
              },
              displayName: {
                type: Type.STRING,
                description: "Human-readable display name",
              },
            },
            required: ["locale", "slug", "displayName"],
          },
        },
      },
    })

    const text = response.text
    if (!text) {
      throw new Error("Empty response from translation")
    }

    return JSON.parse(text) as TagTranslation[]
  } catch (error) {
    console.error("Tag translation failed:", error)
    // Fallback: use the canonical tag for all locales
    return SUPPORTED_LOCALES.map((locale) => ({
      locale,
      slug: canonicalTag,
      displayName: canonicalTag.charAt(0).toUpperCase() + canonicalTag.slice(1),
    }))
  }
}

/**
 * Ensure translations exist for a tag in all supported locales.
 * Creates missing translations using LLM.
 */
export async function ensureTagTranslations(
  canonicalTag: string,
): Promise<void> {
  // Check which locales are missing
  const existing = await db
    .select({ locale: tagTranslations.locale })
    .from(tagTranslations)
    .where(eq(tagTranslations.tagSlug, canonicalTag))

  const existingLocales = new Set(existing.map((e) => e.locale))
  const missingLocales = SUPPORTED_LOCALES.filter(
    (l) => !existingLocales.has(l),
  )

  if (missingLocales.length === 0) {
    return // All translations exist
  }

  // Get translations for all locales (including existing, to ensure consistency)
  const translations = await translateTagWithLLM(canonicalTag)

  // Insert only missing translations
  const toInsert = translations.filter((t) =>
    missingLocales.includes(t.locale as Locale),
  )

  if (toInsert.length > 0) {
    await db
      .insert(tagTranslations)
      .values(
        toInsert.map((t) => ({
          tagSlug: canonicalTag,
          locale: t.locale,
          // For base locale, always use the canonical tag as the slug
          localizedSlug:
            t.locale === BASE_LOCALE ? canonicalTag : t.slug.toLowerCase(),
          displayName: t.displayName,
        })),
      )
      .onConflictDoNothing() // Handle race conditions
  }
}

/**
 * Translate a tag to a specific locale (for batch operations).
 */
export async function translateTagToLocale(
  canonicalTag: string,
  targetLocale: Locale,
): Promise<{ slug: string; displayName: string }> {
  // Check if translation already exists
  const existing = await db.query.tagTranslations.findFirst({
    where: and(
      eq(tagTranslations.tagSlug, canonicalTag),
      eq(tagTranslations.locale, targetLocale),
    ),
  })

  if (existing) {
    return { slug: existing.localizedSlug, displayName: existing.displayName }
  }

  // Get translation from LLM
  const translations = await translateTagWithLLM(canonicalTag)
  const translation = translations.find((t) => t.locale === targetLocale)

  if (translation) {
    // Store it
    await db
      .insert(tagTranslations)
      .values({
        tagSlug: canonicalTag,
        locale: targetLocale,
        localizedSlug: translation.slug.toLowerCase(),
        displayName: translation.displayName,
      })
      .onConflictDoNothing()

    return { slug: translation.slug, displayName: translation.displayName }
  }

  // Fallback
  return {
    slug: canonicalTag,
    displayName: canonicalTag.charAt(0).toUpperCase() + canonicalTag.slice(1),
  }
}

/**
 * Batch lookup of localized slugs and display names for multiple tags.
 * Much more efficient than calling getLocalizedSlug/getLocalizedDisplayName in a loop.
 * Returns a Map keyed by canonical tag slug.
 */
export async function getLocalizedTagsBatch(
  canonicalTags: string[],
  locale: Locale,
): Promise<Map<string, { slug: string; displayName: string }>> {
  if (canonicalTags.length === 0) {
    return new Map()
  }

  const results = await db
    .select({
      tagSlug: tagTranslations.tagSlug,
      localizedSlug: tagTranslations.localizedSlug,
      displayName: tagTranslations.displayName,
    })
    .from(tagTranslations)
    .where(
      and(
        inArray(tagTranslations.tagSlug, canonicalTags),
        eq(tagTranslations.locale, locale),
      ),
    )

  const translationMap = new Map<
    string,
    { slug: string; displayName: string }
  >()

  // Add found translations
  for (const row of results) {
    translationMap.set(row.tagSlug, {
      slug: row.localizedSlug,
      displayName: row.displayName,
    })
  }

  // Fill in fallbacks for any missing tags
  for (const tag of canonicalTags) {
    if (!translationMap.has(tag)) {
      translationMap.set(tag, {
        slug: tag,
        displayName: tag.charAt(0).toUpperCase() + tag.slice(1),
      })
    }
  }

  return translationMap
}

/**
 * Get localized slugs for a single tag across all locales in one query.
 * Returns a Map keyed by locale code.
 * Used for generating hreflang URLs without N+1 queries.
 */
export async function getLocalizedSlugsForAllLocales(
  canonicalTag: string,
): Promise<Map<Locale, string>> {
  const results = await db
    .select({
      locale: tagTranslations.locale,
      localizedSlug: tagTranslations.localizedSlug,
    })
    .from(tagTranslations)
    .where(eq(tagTranslations.tagSlug, canonicalTag))

  const slugMap = new Map<Locale, string>()

  // Add found translations
  for (const row of results) {
    slugMap.set(row.locale as Locale, row.localizedSlug)
  }

  // Fill in fallbacks for any missing locales
  for (const locale of SUPPORTED_LOCALES) {
    if (!slugMap.has(locale)) {
      slugMap.set(locale, canonicalTag)
    }
  }

  return slugMap
}
