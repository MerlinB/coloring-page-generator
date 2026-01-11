import { db } from "$lib/server/db"
import { galleryImages, imageTags } from "$lib/server/db/schema"
import { eq, and, desc, count, sql } from "drizzle-orm"
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
 * Uses a single JOIN query instead of two separate queries.
 */
export async function getImagesByTag(
  tagSlug: string,
  limit: number = 5,
): Promise<PublicGalleryImage[]> {
  const images = await db
    .select({
      id: galleryImages.id,
      blobUrl: galleryImages.blobUrl,
      prompt: galleryImages.prompt,
      format: galleryImages.format,
      createdAt: galleryImages.createdAt,
    })
    .from(galleryImages)
    .innerJoin(imageTags, eq(imageTags.imageId, galleryImages.id))
    .where(
      and(eq(imageTags.tagSlug, tagSlug), eq(galleryImages.isPublic, true)),
    )
    .orderBy(desc(galleryImages.createdAt))
    .limit(limit)

  return images
}

/**
 * Get all unique tags that have at least one public image.
 * Uses a single JOIN query with DISTINCT instead of two separate queries.
 */
export async function getAllPublicTags(): Promise<string[]> {
  const tags = await db
    .selectDistinct({ tagSlug: imageTags.tagSlug })
    .from(imageTags)
    .innerJoin(galleryImages, eq(imageTags.imageId, galleryImages.id))
    .where(eq(galleryImages.isPublic, true))

  return tags.map((t) => t.tagSlug)
}

/**
 * Get tags ordered by popularity (number of public images).
 * Returns the top N tags with their image counts.
 */
export async function getPopularTags(
  limit = 100,
): Promise<{ tagSlug: string; imageCount: number }[]> {
  // Join imageTags with galleryImages, count only public images per tag
  const results = await db
    .select({
      tagSlug: imageTags.tagSlug,
      imageCount: count(imageTags.imageId),
    })
    .from(imageTags)
    .innerJoin(galleryImages, eq(imageTags.imageId, galleryImages.id))
    .where(eq(galleryImages.isPublic, true))
    .groupBy(imageTags.tagSlug)
    .orderBy(desc(sql`count(${imageTags.imageId})`))
    .limit(limit)

  return results.map((r) => ({
    tagSlug: r.tagSlug,
    imageCount: Number(r.imageCount),
  }))
}
