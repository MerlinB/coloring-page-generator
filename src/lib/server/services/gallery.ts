import { db } from "$lib/server/db"
import { galleryImages, imageTags } from "$lib/server/db/schema"
import { eq, and, desc, inArray } from "drizzle-orm"
import { uploadToBlob } from "./blob"
import { extractTagsAndFilter } from "./tagging"
import { ensureTagTranslations } from "./tagTranslation"
import type { PageFormat } from "$lib/types"

export interface PublicGalleryImage {
  id: string
  blobUrl: string
  prompt: string
  format: string
  createdAt: Date
}

/**
 * Save an image to the public gallery.
 * Uploads to Vercel Blob, extracts tags, and stores in database.
 * Returns quickly - designed to be called fire-and-forget.
 */
export async function saveToPublicGallery(
  imageData: string,
  prompt: string,
  format: PageFormat,
  generationId?: string,
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    // 1. Extract tags and check content appropriateness
    const tagging = await extractTagsAndFilter(prompt)

    // 2. Upload image to Vercel Blob
    const filename = `gallery/${crypto.randomUUID()}.png`
    const blob = await uploadToBlob(imageData, filename)

    // 3. Insert gallery image record
    const [galleryImage] = await db
      .insert(galleryImages)
      .values({
        generationId: generationId ?? null,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        prompt,
        isPublic: tagging.isAppropriate,
        flagReason: tagging.flagReason,
        format,
      })
      .returning()

    // 4. Insert tags
    if (tagging.tags.length > 0) {
      await db.insert(imageTags).values(
        tagging.tags.map((tagSlug) => ({
          imageId: galleryImage.id,
          tagSlug,
        })),
      )

      // 5. Ensure tag translations exist for all tags
      await Promise.all(tagging.tags.map((tag) => ensureTagTranslations(tag)))
    }

    return { success: true, imageId: galleryImage.id }
  } catch (error) {
    console.error("Failed to save to public gallery:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get the most recent public images for a given tag.
 */
export async function getImagesByTag(
  tagSlug: string,
  limit: number = 5,
): Promise<PublicGalleryImage[]> {
  // Find all image IDs that have this tag
  const taggedImages = await db
    .select({ imageId: imageTags.imageId })
    .from(imageTags)
    .where(eq(imageTags.tagSlug, tagSlug))

  if (taggedImages.length === 0) {
    return []
  }

  const imageIds = taggedImages.map((t) => t.imageId)

  // Get the actual images that are public
  const images = await db
    .select({
      id: galleryImages.id,
      blobUrl: galleryImages.blobUrl,
      prompt: galleryImages.prompt,
      format: galleryImages.format,
      createdAt: galleryImages.createdAt,
    })
    .from(galleryImages)
    .where(
      and(
        inArray(galleryImages.id, imageIds),
        eq(galleryImages.isPublic, true),
      ),
    )
    .orderBy(desc(galleryImages.createdAt))
    .limit(limit)

  return images
}

/**
 * Get all unique tags that have at least one public image.
 */
export async function getAllPublicTags(): Promise<string[]> {
  // Get all image IDs that are public
  const publicImages = await db
    .select({ id: galleryImages.id })
    .from(galleryImages)
    .where(eq(galleryImages.isPublic, true))

  if (publicImages.length === 0) {
    return []
  }

  const publicImageIds = publicImages.map((img) => img.id)

  // Get unique tags from these images
  const tags = await db
    .selectDistinct({ tagSlug: imageTags.tagSlug })
    .from(imageTags)
    .where(inArray(imageTags.imageId, publicImageIds))

  return tags.map((t) => t.tagSlug)
}
