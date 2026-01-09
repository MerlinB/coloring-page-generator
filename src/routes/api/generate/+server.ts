import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { generateColoringPage, editColoringPage } from "$lib/server/gemini"
import {
  consumeGeneration,
  getUsageForDevice,
} from "$lib/server/services/usage"
import type { PageFormat } from "$lib/types"

export const POST: RequestHandler = async ({ request, locals }) => {
  const fingerprint = locals.fingerprint
  const body = await request.json()
  const { prompt, kidFriendly, format, editMode, sourceImageData, sourcePrompt } =
    body

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

  // Check usage before generating
  const usage = await getUsageForDevice(fingerprint)
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

    // Consume usage AFTER successful generation
    const consumeResult = await consumeGeneration(fingerprint, trimmedPrompt)

    if (!consumeResult.success) {
      // Generation succeeded but couldn't consume - log and allow it
      console.error("Failed to consume generation:", consumeResult.error)
    }

    // Get updated usage
    const newUsage = await getUsageForDevice(fingerprint)

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
