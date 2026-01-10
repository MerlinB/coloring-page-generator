import { GoogleGenAI, Type } from "@google/genai"
import { GEMINI_API_KEY } from "$env/static/private"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

const MODEL = "gemini-2.5-flash"
const API_TIMEOUT_MS = 15000

/**
 * Result of tag extraction and content filtering.
 */
export interface TaggingResult {
  /** Canonical English tags (lowercase, singular) */
  tags: string[]
  /** Whether the prompt is appropriate for public display */
  isAppropriate: boolean
  /** Reason for flagging if not appropriate */
  flagReason: string | null
}

/**
 * Wraps a promise with a timeout.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Tag extraction timed out")), ms),
    ),
  ])
}

const TAGGING_PROMPT = `You are a content classifier for a children's coloring page generator.

Analyze the provided prompt and extract relevant tags for categorization.

Tag guidelines:
- Use common English words (e.g., "dinosaur" not "dino")
- Singular form (e.g., "butterfly" not "butterflies")
- Lowercase only
- Extract 1-5 tags, picking the most relevant
- Focus on the main subject and theme

Flag as inappropriate (isAppropriate: false) ONLY if the prompt contains:
- Personal information (names of real people, addresses, phone numbers, emails)
- Graphic violence or gore (blood, injury, death)
- Sexual or adult content
- Hate speech or discriminatory language

Do NOT flag as inappropriate:
- Normal emotions (crying, sad, angry, scared) - these are natural and fine
- Adventure themes with weapons (knights with swords, pirates with cutlasses, archers)
- Fantasy creatures or monsters (dragons, zombies, witches)
- Any typical children's coloring book themes

Prompt to analyze: `

/**
 * Extract tags from a prompt and check if it's appropriate for public display.
 * Uses Gemini Flash with structured output for reliable JSON responses.
 */
export async function extractTagsAndFilter(
  prompt: string,
): Promise<TaggingResult> {
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: `${TAGGING_PROMPT}"${prompt}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "1-5 canonical English tags (lowercase, singular form)",
              },
              isAppropriate: {
                type: Type.BOOLEAN,
                description:
                  "Whether the prompt is appropriate for public display",
              },
              flagReason: {
                type: Type.STRING,
                nullable: true,
                description:
                  "Brief reason why the prompt was flagged, or null if appropriate",
              },
            },
            required: ["tags", "isAppropriate"],
          },
        },
      }),
      API_TIMEOUT_MS,
    )

    const text = response.text
    if (!text) {
      console.error("Empty response from tag extraction")
      return { tags: ["general"], isAppropriate: true, flagReason: null }
    }

    const result = JSON.parse(text) as TaggingResult

    // Normalize tags: lowercase, trim, remove empty
    result.tags = result.tags
      .map((tag) => tag.toLowerCase().trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 5)

    // Ensure at least one tag
    if (result.tags.length === 0) {
      result.tags = ["general"]
    }

    return result
  } catch (error) {
    console.error("Tag extraction failed:", error)
    // On error, default to allowing the image with generic tag
    return { tags: ["general"], isAppropriate: true, flagReason: null }
  }
}
