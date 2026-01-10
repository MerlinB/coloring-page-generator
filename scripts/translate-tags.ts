/**
 * Batch translate tags to a new locale.
 *
 * Usage: pnpm translate-tags <locale>
 * Example: pnpm translate-tags fr
 *
 * This script is used when adding a new language to translate all existing
 * canonical English tags to the new locale.
 */

import { config } from "dotenv"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { GoogleGenAI, Type } from "@google/genai"
import { eq, and } from "drizzle-orm"
import {
  imageTags,
  tagTranslations,
} from "../src/lib/server/db/schema"

// Load environment variables
config()

const DATABASE_URL = process.env.DATABASE_URL
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable not set")
  process.exit(1)
}

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable not set")
  process.exit(1)
}

// Set up database
const sql = neon(DATABASE_URL)
const db = drizzle(sql)

// Set up Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const MODEL = "gemini-2.5-flash"

// Locale display names for better translation prompts
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
}

interface TagTranslation {
  slug: string
  displayName: string
}

async function translateTag(
  canonicalTag: string,
  targetLocale: string,
): Promise<TagTranslation> {
  const localeName = LOCALE_NAMES[targetLocale] || targetLocale

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Translate this English tag for a children's coloring page gallery into ${localeName}.

Tag to translate: "${canonicalTag}"

Provide:
- slug: URL-safe lowercase version (no spaces, use hyphens if needed, use appropriate characters for the language)
- displayName: Human-readable capitalized version in ${localeName}

Be accurate and natural-sounding in ${localeName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slug: {
              type: Type.STRING,
              description: "URL-safe lowercase slug",
            },
            displayName: {
              type: Type.STRING,
              description: "Human-readable display name",
            },
          },
          required: ["slug", "displayName"],
        },
      },
    })

    const text = response.text
    if (!text) {
      throw new Error("Empty response from translation")
    }

    return JSON.parse(text) as TagTranslation
  } catch (error) {
    console.error(`  Failed to translate "${canonicalTag}":`, error)
    // Fallback: use the canonical tag
    return {
      slug: canonicalTag,
      displayName: canonicalTag.charAt(0).toUpperCase() + canonicalTag.slice(1),
    }
  }
}

async function getAllUniqueTags(): Promise<string[]> {
  const tags = await db
    .selectDistinct({ tagSlug: imageTags.tagSlug })
    .from(imageTags)

  return tags.map((t) => t.tagSlug)
}

async function getExistingTranslations(locale: string): Promise<Set<string>> {
  const existing = await db
    .select({ tagSlug: tagTranslations.tagSlug })
    .from(tagTranslations)
    .where(eq(tagTranslations.locale, locale))

  return new Set(existing.map((e) => e.tagSlug))
}

async function main() {
  const targetLocale = process.argv[2]

  if (!targetLocale) {
    console.error("Usage: pnpm translate-tags <locale>")
    console.error("Example: pnpm translate-tags fr")
    process.exit(1)
  }

  console.log(`\nTranslating tags to locale: ${targetLocale}`)
  console.log(`Language: ${LOCALE_NAMES[targetLocale] || "Unknown"}\n`)

  // Get all unique tags
  const allTags = await getAllUniqueTags()
  console.log(`Found ${allTags.length} unique tags in the database`)

  // Get existing translations for this locale
  const existingTranslations = await getExistingTranslations(targetLocale)
  console.log(
    `Already translated: ${existingTranslations.size} tags\n`,
  )

  // Filter to only tags that need translation
  const tagsToTranslate = allTags.filter((tag) => !existingTranslations.has(tag))
  console.log(`Tags to translate: ${tagsToTranslate.length}\n`)

  if (tagsToTranslate.length === 0) {
    console.log("All tags are already translated!")
    process.exit(0)
  }

  // Translate each tag
  let successCount = 0
  let failCount = 0

  for (const tag of tagsToTranslate) {
    process.stdout.write(`Translating "${tag}"... `)

    try {
      const translation = await translateTag(tag, targetLocale)

      await db.insert(tagTranslations).values({
        tagSlug: tag,
        locale: targetLocale,
        localizedSlug: translation.slug.toLowerCase(),
        displayName: translation.displayName,
      }).onConflictDoNothing()

      console.log(`✓ ${translation.displayName} (${translation.slug})`)
      successCount++
    } catch (error) {
      console.log(`✗ Failed`)
      failCount++
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`\n--- Summary ---`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log(`Total: ${tagsToTranslate.length}`)
}

main().catch((error) => {
  console.error("Script failed:", error)
  process.exit(1)
})
