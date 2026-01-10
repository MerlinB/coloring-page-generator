import { GoogleGenAI, Type } from "@google/genai"
import { GEMINI_API_KEY } from "$env/static/private"
import { db } from "$lib/server/db"
import { tagTranslations } from "$lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import type { Locale } from "$lib/i18n/domains"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const MODEL = "gemini-2.5-flash"

// Locale display names for LLM prompts
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
}

interface TagInfo {
  tagSlug: string
  displayName: string
}

/**
 * Batch generate 3 prompt suggestions for each tag in a specific locale.
 * Returns a map of tagSlug -> suggestions array.
 */
export async function generateBatchSuggestionsWithLLM(
  tags: TagInfo[],
  locale: Locale,
): Promise<Record<string, string[]>> {
  if (tags.length === 0) {
    return {}
  }

  const localeName = LOCALE_NAMES[locale] || locale
  const tagList = tags
    .map((t) => `- ${t.tagSlug} (displayed as "${t.displayName}")`)
    .join("\n")

  // Build the response schema with each tag as a property
  const properties: Record<string, { type: typeof Type.ARRAY; items: { type: typeof Type.STRING } }> = {}
  for (const tag of tags) {
    properties[tag.tagSlug] = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate 3 creative and varied prompt suggestions for children's coloring pages for each of these tags.

Language: ${localeName}
Tags:
${tagList}

Requirements for each suggestion:
- Write in ${localeName}
- Each suggestion should be a complete, natural-sounding prompt for generating a coloring page
- Vary the themes: include playful/happy themes, scenes with settings, and themes with added elements
- Keep each suggestion under 50 characters
- Make them fun and appealing to children
- Be creative! Do NOT just say "Happy [tag]" or "Cute [tag]" - add interesting context or activities

Good examples for "dinosaur" in English:
- "Friendly T-Rex eating ice cream"
- "Baby dinosaur hatching from egg"
- "Dinosaur playing in a meadow"

Bad examples (too generic):
- "Happy dinosaur"
- "Cute dinosaur"
- "Dinosaur with flowers"

Return exactly 3 suggestions for each tag.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties,
          required: tags.map((t) => t.tagSlug),
        },
      },
    })

    const text = response.text
    if (!text) {
      throw new Error("Empty response from suggestions generation")
    }

    const result = JSON.parse(text) as Record<string, string[]>

    // Ensure each tag has exactly 3 suggestions
    for (const tag of tags) {
      if (!result[tag.tagSlug] || !Array.isArray(result[tag.tagSlug])) {
        result[tag.tagSlug] = []
      } else {
        result[tag.tagSlug] = result[tag.tagSlug].slice(0, 3)
      }
    }

    return result
  } catch (error) {
    console.error(`Batch suggestion generation failed for locale ${locale}:`, error)
    // Return empty object on error - caller should handle fallback
    return {}
  }
}

/**
 * Get prompt suggestions for a tag in a specific locale.
 * Returns stored suggestions or empty array if none exist.
 */
export async function getPromptSuggestions(
  canonicalTag: string,
  locale: Locale,
): Promise<string[]> {
  const result = await db.query.tagTranslations.findFirst({
    where: and(
      eq(tagTranslations.tagSlug, canonicalTag),
      eq(tagTranslations.locale, locale),
    ),
    columns: {
      promptSuggestions: true,
    },
  })

  return result?.promptSuggestions ?? []
}
