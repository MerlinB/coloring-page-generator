import { GoogleGenAI } from "@google/genai"
import { GEMINI_API_KEY } from "$env/static/private"
import type { GenerationResult, PageFormat } from "$lib/types"

const FORMAT_TO_ASPECT_RATIO: Record<PageFormat, string> = {
  portrait: "3:4",
  landscape: "4:3",
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

const BASE_PROMPT = `Create a coloring page illustration.

Requirements:
- Black line art on pure white background
- Clean, bold outlines (like a coloring book)
- No filled areas, shading, or gradients
- Clear, distinct shapes that are easy to color inside the lines

Style: Traditional coloring book line drawing`

const KID_FRIENDLY_ADDITIONS = `
- Child-friendly and age-appropriate content
- Simple shapes suitable for young children
- Medium level of detail - not too intricate`

export async function generateColoringPage(
  userPrompt: string,
  kidFriendly: boolean = false,
  format: PageFormat = "portrait",
): Promise<GenerationResult> {
  try {
    const prompt = kidFriendly
      ? `${BASE_PROMPT}${KID_FRIENDLY_ADDITIONS}`
      : BASE_PROMPT

    const enhancedPrompt = `${prompt}

Subject: ${userPrompt}`

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: enhancedPrompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: FORMAT_TO_ASPECT_RATIO[format],
        },
      },
    })

    const candidate = response.candidates?.[0]
    if (!candidate?.content?.parts) {
      return { success: false, error: "No image was generated" }
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return {
          success: true,
          imageData: part.inlineData.data,
        }
      }
    }

    return { success: false, error: "No image data in response" }
  } catch (error) {
    console.error("Gemini API error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "API request failed",
    }
  }
}
