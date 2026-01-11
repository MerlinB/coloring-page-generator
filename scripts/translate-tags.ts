/**
 * Batch translate tags to supported locales.
 *
 * Usage: pnpm translate-tags [locale] [--limit N]
 * Example: pnpm translate-tags           (translates to all locales: en, de)
 *          pnpm translate-tags de        (translates to de only)
 *          pnpm translate-tags --limit 50 (all locales, 50 items each)
 *
 * This script translates canonical English tags to all supported locales.
 * For English, it generates proper displayNames while keeping the slug unchanged.
 * For other locales, it generates both localized slugs and displayNames.
 *
 * Optimized batching: Makes ONE API call per batch of tags (default 25 tags/batch).
 * This means 100 tags = 4 API calls (not 100).
 *
 * Safety features for cron usage:
 * - MAX_ITEMS_PER_RUN: Limits items processed per run (default 100, override with --limit)
 * - Exits immediately on database errors to avoid burning API credits
 */

import { config } from "dotenv"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { GoogleGenAI, Type } from "@google/genai"
import { eq } from "drizzle-orm"
import { imageTags, tagTranslations } from "../src/lib/server/db/schema"
import { SUPPORTED_LOCALES, BASE_LOCALE } from "../src/lib/i18n/domains"

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

interface BatchTranslationResult {
  [tagSlug: string]: TagTranslation
}

const BATCH_SIZE = 25
const DEFAULT_MAX_ITEMS = 100

/**
 * Parse --limit argument from command line.
 */
function parseMaxItems(): number {
  const limitIndex = process.argv.indexOf("--limit")
  if (limitIndex !== -1 && process.argv[limitIndex + 1]) {
    const limit = parseInt(process.argv[limitIndex + 1], 10)
    if (!isNaN(limit) && limit > 0) {
      return limit
    }
  }
  return DEFAULT_MAX_ITEMS
}

/**
 * Generate fallback translation when batch processing misses a tag.
 */
function fallbackTranslation(tag: string): TagTranslation {
  return {
    slug: tag,
    displayName: tag.charAt(0).toUpperCase() + tag.slice(1),
  }
}

/**
 * Batch translate multiple tags in a single API call.
 */
async function translateBatch(
  tags: string[],
  targetLocale: string,
): Promise<BatchTranslationResult> {
  if (tags.length === 0) {
    return {}
  }

  const localeName = LOCALE_NAMES[targetLocale] || targetLocale
  const tagList = tags.map((t) => `- ${t}`).join("\n")

  // Build dynamic schema with each tag as a property
  const properties: Record<string, object> = {}
  for (const tag of tags) {
    properties[tag] = {
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
    }
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Translate these English tags for a children's coloring page gallery into ${localeName}.

Tags to translate:
${tagList}

For each tag, provide:
- slug: URL-safe lowercase version (no spaces, use hyphens if needed, use appropriate characters for the language)
- displayName: Human-readable capitalized version in ${localeName}

Be accurate and natural-sounding in ${localeName}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties,
        required: tags,
      },
    },
  })

  const text = response.text
  if (!text) {
    throw new Error("Empty response from batch translation")
  }

  return JSON.parse(text) as BatchTranslationResult
}

/**
 * Split an array into chunks of the specified size.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
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

interface TranslationResult {
  successCount: number
  failCount: number
  totalProcessed: number
  batchCount: number
}

/**
 * Translate tags to a specific locale.
 * Returns statistics about the translation run.
 */
async function translateToLocale(
  targetLocale: string,
  maxItems: number,
  allTags: string[],
): Promise<TranslationResult> {
  console.log(`\n${"=".repeat(60)}`)
  console.log(
    `Translating to: ${targetLocale} (${LOCALE_NAMES[targetLocale] || "Unknown"})`,
  )
  console.log(`${"=".repeat(60)}`)

  // Get existing translations for this locale
  const existingTranslations = await getExistingTranslations(targetLocale)
  console.log(`Already translated: ${existingTranslations.size} tags`)

  // Filter to only tags that need translation, apply limit
  const allTagsToTranslate = allTags.filter(
    (tag) => !existingTranslations.has(tag),
  )
  const tagsToTranslate = allTagsToTranslate.slice(0, maxItems)

  if (allTagsToTranslate.length > maxItems) {
    console.log(
      `Tags needing translation: ${allTagsToTranslate.length} (limited to ${maxItems})`,
    )
  } else {
    console.log(`Tags to translate: ${tagsToTranslate.length}`)
  }

  if (tagsToTranslate.length === 0) {
    console.log("All tags are already translated for this locale!")
    return { successCount: 0, failCount: 0, totalProcessed: 0, batchCount: 0 }
  }

  // Chunk tags into batches for efficient API usage
  const batches = chunkArray(tagsToTranslate, BATCH_SIZE)
  console.log(
    `Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} tags each\n`,
  )

  let successCount = 0
  let failCount = 0
  let batchNum = 0

  for (const batch of batches) {
    batchNum++
    console.log(
      `--- Batch ${batchNum}/${batches.length} (${batch.length} tags) ---`,
    )

    try {
      const results = await translateBatch(batch, targetLocale)

      // Process each tag in the batch
      for (const tag of batch) {
        const translation = results[tag] ?? fallbackTranslation(tag)
        const usedFallback = !results[tag]

        // For base locale, always use the canonical tag as the slug
        const localizedSlug =
          targetLocale === BASE_LOCALE ? tag : translation.slug.toLowerCase()

        try {
          await db
            .insert(tagTranslations)
            .values({
              tagSlug: tag,
              locale: targetLocale,
              localizedSlug,
              displayName: translation.displayName,
            })
            .onConflictDoNothing()
        } catch (dbError) {
          console.error(
            `\n[FATAL] Database error after successful API call - exiting to prevent credit waste`,
          )
          console.error(`  Tag: ${tag}`)
          console.error(`  Error:`, dbError)
          console.log(`\n=== Partial Summary (interrupted) ===`)
          console.log(`Successful: ${successCount}`)
          console.log(`Fallbacks: ${failCount}`)
          process.exit(1)
        }

        if (usedFallback) {
          console.log(`  [FALLBACK] ${tag} → ${translation.displayName}`)
          failCount++
        } else {
          console.log(
            `  [OK] ${tag} → ${translation.displayName} (${localizedSlug})`,
          )
          successCount++
        }
      }
    } catch (error) {
      console.error(`  [ERROR] Batch ${batchNum} API call failed:`, error)
      // Apply fallback for entire batch - but exit on DB error
      for (const tag of batch) {
        const translation = fallbackTranslation(tag)
        const localizedSlug =
          targetLocale === BASE_LOCALE ? tag : translation.slug.toLowerCase()
        try {
          await db
            .insert(tagTranslations)
            .values({
              tagSlug: tag,
              locale: targetLocale,
              localizedSlug,
              displayName: translation.displayName,
            })
            .onConflictDoNothing()
        } catch (dbError) {
          console.error(
            `\n[FATAL] Database error - exiting to prevent further issues`,
          )
          console.error(`  Error:`, dbError)
          process.exit(1)
        }
        console.log(`  [FALLBACK] ${tag} → ${translation.displayName}`)
        failCount++
      }
    }
  }

  console.log(`\n--- ${targetLocale} Summary ---`)
  console.log(`Successful: ${successCount}`)
  console.log(`Fallbacks: ${failCount}`)
  console.log(`Total: ${tagsToTranslate.length}`)
  console.log(`API calls: ${batches.length}`)

  return {
    successCount,
    failCount,
    totalProcessed: tagsToTranslate.length,
    batchCount: batches.length,
  }
}

async function main() {
  const localeArg = process.argv[2]
  const maxItems = parseMaxItems()

  // Determine which locales to translate
  let targetLocales: readonly string[]
  if (localeArg && !localeArg.startsWith("--")) {
    targetLocales = [localeArg]
  } else {
    targetLocales = SUPPORTED_LOCALES
  }

  console.log(`\nTranslate Tags Script`)
  console.log(`Target locales: ${targetLocales.join(", ")}`)
  console.log(`Max items per locale: ${maxItems}`)

  // Get all unique tags once
  const allTags = await getAllUniqueTags()
  console.log(`Found ${allTags.length} unique tags in the database`)

  // Track totals across all locales
  let totalSuccess = 0
  let totalFail = 0
  let totalProcessed = 0
  let totalBatches = 0

  // Process each locale
  for (const locale of targetLocales) {
    const result = await translateToLocale(locale, maxItems, allTags)
    totalSuccess += result.successCount
    totalFail += result.failCount
    totalProcessed += result.totalProcessed
    totalBatches += result.batchCount
  }

  // Print grand summary if multiple locales
  if (targetLocales.length > 1) {
    console.log(`\n${"=".repeat(60)}`)
    console.log(`GRAND TOTAL (${targetLocales.length} locales)`)
    console.log(`${"=".repeat(60)}`)
    console.log(`Successful: ${totalSuccess}`)
    console.log(`Fallbacks: ${totalFail}`)
    console.log(`Total processed: ${totalProcessed}`)
    console.log(`Total API calls: ${totalBatches}`)
  }

  if (totalProcessed === 0) {
    console.log(`\nAll tags are already translated for all locales!`)
  }
}

main().catch((error) => {
  console.error("Script failed:", error)
  process.exit(1)
})
