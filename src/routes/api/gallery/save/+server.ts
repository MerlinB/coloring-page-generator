import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { saveToPublicGallery } from "$lib/server/services/gallery"
import type { PageFormat } from "$lib/types"

// Max base64 image size: ~5MB
const MAX_IMAGE_DATA_LENGTH = 5 * 1024 * 1024

/**
 * Validates that a string is valid base64.
 */
function isValidBase64(str: string): boolean {
  if (str.length === 0) return false
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str)
}

/**
 * POST /api/gallery/save
 *
 * Async endpoint for saving generated images to the public gallery.
 * Called fire-and-forget from the client after successful generation.
 * Does not block the user experience.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const { imageData, prompt, format } = body

  // Validate imageData
  if (!imageData || typeof imageData !== "string") {
    return json({ error: "Missing image data" }, { status: 400 })
  }

  if (imageData.length > MAX_IMAGE_DATA_LENGTH) {
    return json({ error: "Image too large" }, { status: 400 })
  }

  if (!isValidBase64(imageData)) {
    return json({ error: "Invalid image encoding" }, { status: 400 })
  }

  // Validate prompt
  if (!prompt || typeof prompt !== "string") {
    return json({ error: "Missing prompt" }, { status: 400 })
  }

  if (prompt.length > 500) {
    return json({ error: "Prompt too long" }, { status: 400 })
  }

  // Validate format
  const pageFormat: PageFormat =
    format === "landscape" ? "landscape" : "portrait"

  // Save to gallery (this handles blob upload, tagging, and DB insert)
  const result = await saveToPublicGallery(imageData, prompt.trim(), pageFormat)

  if (!result.success) {
    // Log but don't expose internal errors
    console.error("Gallery save failed:", result.error)
    return json({ error: "Failed to save to gallery" }, { status: 500 })
  }

  return json({ success: true, imageId: result.imageId })
}
