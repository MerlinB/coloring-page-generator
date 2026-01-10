/**
 * Batch generate prompt suggestions for tag translations.
 *
 * Usage: pnpm generate-suggestions [locale]
 * Example: pnpm generate-suggestions de     # German only
 *          pnpm generate-suggestions        # All locales
 *
 * Optimized batching: Makes ONE API call per batch of tags (default 25 tags/batch).
 * This means 100 tags × 10 locales = 40 API calls (not 1,000).
 *
 * Skips rows that already have suggestions populated.
 */

import { config } from "dotenv"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { GoogleGenAI, Type } from "@google/genai"
import { eq, or, isNull, sql } from "drizzle-orm"
import { tagTranslations } from "../src/lib/server/db/schema"

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
const sqlClient = neon(DATABASE_URL)
const db = drizzle(sqlClient)

// Set up Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const MODEL = "gemini-2.5-flash"

// Locale display names for LLM prompts
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

interface TagRow {
  id: string
  tagSlug: string
  displayName: string
  locale: string
}

interface TagInfo {
  tagSlug: string
  displayName: string
}

const BATCH_SIZE = 25

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

/**
 * Batch generate 3 prompt suggestions for each tag in a specific locale.
 * Returns a map of tagSlug -> suggestions array.
 */
async function generateBatchSuggestions(
  tags: TagInfo[],
  locale: string,
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
}

/**
 * Get all tag translations that need suggestions (null or empty array).
 */
async function getTranslationsNeedingSuggestions(
  targetLocale?: string,
): Promise<TagRow[]> {
  const needsSuggestions = or(
    isNull(tagTranslations.promptSuggestions),
    sql`cardinality(${tagTranslations.promptSuggestions}) = 0`,
  )

  if (targetLocale) {
    return db
      .select({
        id: tagTranslations.id,
        tagSlug: tagTranslations.tagSlug,
        displayName: tagTranslations.displayName,
        locale: tagTranslations.locale,
      })
      .from(tagTranslations)
      .where(sql`${needsSuggestions} AND ${tagTranslations.locale} = ${targetLocale}`)
      .orderBy(tagTranslations.tagSlug)
  }

  return db
    .select({
      id: tagTranslations.id,
      tagSlug: tagTranslations.tagSlug,
      displayName: tagTranslations.displayName,
      locale: tagTranslations.locale,
    })
    .from(tagTranslations)
    .where(needsSuggestions)
    .orderBy(tagTranslations.locale, tagTranslations.tagSlug)
}

/**
 * Update suggestions for a single tag translation row.
 */
async function updateSuggestions(id: string, suggestions: string[]): Promise<void> {
  await db
    .update(tagTranslations)
    .set({ promptSuggestions: suggestions })
    .where(eq(tagTranslations.id, id))
}

async function main() {
  const targetLocale = process.argv[2]

  console.log("\n=== Generate Prompt Suggestions ===\n")
  if (targetLocale) {
    console.log(`Target locale: ${targetLocale} (${LOCALE_NAMES[targetLocale] || "Unknown"})`)
  } else {
    console.log("Target locale: all locales")
  }
  console.log()

  // Get translations that need suggestions
  const translations = await getTranslationsNeedingSuggestions(targetLocale)
  console.log(`Found ${translations.length} translations needing suggestions\n`)

  if (translations.length === 0) {
    console.log("All translations already have suggestions!")
    process.exit(0)
  }

  // Group by locale
  const byLocale = new Map<string, TagRow[]>()
  for (const t of translations) {
    const existing = byLocale.get(t.locale) ?? []
    existing.push(t)
    byLocale.set(t.locale, existing)
  }

  console.log(`Grouped into ${byLocale.size} locale(s):\n`)
  for (const [locale, rows] of byLocale) {
    console.log(`  ${locale}: ${rows.length} tags`)
  }
  console.log()

  let totalSuccess = 0
  let totalFail = 0
  let totalApiCalls = 0

  // Process each locale in batches
  for (const [locale, rows] of byLocale) {
    const localeName = LOCALE_NAMES[locale] || locale
    console.log(`\n--- Processing ${locale} (${localeName}) - ${rows.length} tags ---\n`)

    // Chunk rows into batches
    const batches = chunkArray(rows, BATCH_SIZE)
    console.log(`  Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} tags each\n`)

    let localeSuccess = 0
    let localeFail = 0

    for (let batchNum = 0; batchNum < batches.length; batchNum++) {
      const batch = batches[batchNum]
      console.log(`  Batch ${batchNum + 1}/${batches.length} (${batch.length} tags)...`)

      const tagInfos: TagInfo[] = batch.map((r) => ({
        tagSlug: r.tagSlug,
        displayName: r.displayName,
      }))

      try {
        const suggestions = await generateBatchSuggestions(tagInfos, locale)
        totalApiCalls++

        for (const row of batch) {
          const tagSuggestions = suggestions[row.tagSlug]
          if (tagSuggestions && tagSuggestions.length > 0) {
            await updateSuggestions(row.id, tagSuggestions)
            console.log(`    [OK] ${row.tagSlug}:`)
            tagSuggestions.forEach((s, i) => console.log(`         ${i + 1}. ${s}`))
            localeSuccess++
          } else {
            console.log(`    [FAIL] ${row.tagSlug}: No suggestions generated`)
            localeFail++
          }
        }
      } catch (error) {
        console.error(`    [ERROR] Batch ${batchNum + 1} failed:`, error)
        localeFail += batch.length
        totalApiCalls++
      }
    }

    console.log(`\n  Locale ${locale}: ${localeSuccess} OK, ${localeFail} failed`)
    totalSuccess += localeSuccess
    totalFail += localeFail
  }

  console.log(`\n=== Summary ===`)
  console.log(`Successful: ${totalSuccess}`)
  console.log(`Failed: ${totalFail}`)
  console.log(`Total: ${translations.length}`)
  console.log(`API calls made: ${totalApiCalls}`)
}

main().catch((error) => {
  console.error("Script failed:", error)
  process.exit(1)
})
