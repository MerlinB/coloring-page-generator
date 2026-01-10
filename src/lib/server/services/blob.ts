import { put, del } from "@vercel/blob"
import { env } from "$env/dynamic/private"

/**
 * Upload a base64-encoded image to Vercel Blob storage.
 * Returns the public URL and pathname (for deletion).
 */
export async function uploadToBlob(
  base64Data: string,
  filename: string,
): Promise<{ url: string; pathname: string }> {
  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, "base64")

  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "image/png",
    token: env.BLOB_READ_WRITE_TOKEN,
  })

  return {
    url: blob.url,
    pathname: blob.pathname,
  }
}

/**
 * Delete an image from Vercel Blob storage by pathname.
 */
export async function deleteFromBlob(pathname: string): Promise<void> {
  await del(pathname, { token: env.BLOB_READ_WRITE_TOKEN })
}
