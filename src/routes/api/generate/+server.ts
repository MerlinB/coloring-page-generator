import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { generateColoringPage, editColoringPage } from "$lib/server/gemini"
import { getUsageWithCodes, consumeWithCodes } from "$lib/server/services/usage"
import type { PageFormat } from "$lib/types"

// Max base64 image size: ~5MB (base64 adds ~33% overhead, so ~3.75MB original)
const MAX_IMAGE_DATA_LENGTH = 5 * 1024 * 1024

/**
 * Validates that a string is valid base64.
 */
function isValidBase64(str: string): boolean {
  if (str.length === 0) return false
  // Base64 can contain A-Z, a-z, 0-9, +, /, and = for padding
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str)
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const fingerprint = locals.fingerprint
  const body = await request.json()
  const {
    prompt,
    kidFriendly,
    format,
    editMode,
    sourceImageData,
    sourcePrompt,
    codes: rawCodes,
  } = body

  // Extract codes array from request
  const codes: string[] = Array.isArray(rawCodes) ? rawCodes : []

  if (!prompt || typeof prompt !== "string") {
    return json(
      { error: "Please tell us what you would like to color!" },
      { status: 400 },
    )
  }

  const trimmedPrompt = prompt.trim()

  if (trimmedPrompt.length === 0) {
    return json({ error: "Please enter a description!" }, { status: 400 })
  }

  if (trimmedPrompt.length > 200) {
    return json(
      { error: "Description too long (max 200 characters)" },
      { status: 400 },
    )
  }

  // Validate sourceImageData if provided (edit mode)
  if (editMode && sourceImageData) {
    if (typeof sourceImageData !== "string") {
      return json({ error: "Invalid image data format" }, { status: 400 })
    }

    if (sourceImageData.length > MAX_IMAGE_DATA_LENGTH) {
      return json({ error: "Image too large (max 5MB)" }, { status: 400 })
    }

    if (!isValidBase64(sourceImageData)) {
      return json({ error: "Invalid image encoding" }, { status: 400 })
    }
  }

  // Check usage before generating (using client-provided codes)
  const usage = await getUsageWithCodes(fingerprint, codes)
  if (usage.tokenBalance <= 0 && usage.freeRemaining <= 0) {
    return json(
      {
        error: "No generations remaining",
        needsTokens: true,
      },
      { status: 402 },
    ) // 402 Payment Required
  }

  try {
    let result
    const pageFormat: PageFormat =
      format === "landscape" ? "landscape" : "portrait"

    if (editMode && sourceImageData) {
      result = await editColoringPage(
        sourceImageData,
        trimmedPrompt,
        kidFriendly ?? false,
        pageFormat,
      )
    } else {
      result = await generateColoringPage(
        trimmedPrompt,
        kidFriendly ?? false,
        pageFormat,
      )
    }

    if (!result.success || !result.imageData) {
      return json(
        {
          error: result.error ?? "Could not create your coloring page",
        },
        { status: 500 },
      )
    }

    // Consume usage AFTER successful generation (using client-provided codes)
    const consumeResult = await consumeWithCodes(
      fingerprint,
      trimmedPrompt,
      codes,
    )

    if (!consumeResult.success) {
      // Generation succeeded but couldn't consume - log and allow it
      console.error("Failed to consume generation:", consumeResult.error)
    }

    // Get updated usage
    const newUsage = await getUsageWithCodes(fingerprint, codes)

    const finalPrompt =
      editMode && sourcePrompt
        ? `${sourcePrompt} (edited: ${trimmedPrompt})`
        : trimmedPrompt

    return json({
      success: true,
      image: {
        id: crypto.randomUUID(),
        prompt: finalPrompt,
        imageData: result.imageData,
        createdAt: new Date().toISOString(),
        format: pageFormat,
      },
      usage: newUsage,
    })
  } catch (error) {
    console.error("Generation error:", error)
    return json(
      { error: "Something went wrong. Please try again!" },
      { status: 500 },
    )
  }
}
