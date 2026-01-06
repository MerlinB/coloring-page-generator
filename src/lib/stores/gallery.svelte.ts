import type { GalleryImage } from "$lib/types"
import {
  getAllImages,
  addImageToDB,
  removeImageFromDB,
  createGallerySync,
} from "$lib/db"

function createGalleryStore() {
  let images = $state<GalleryImage[]>([])
  let currentImage = $state<GalleryImage | null>(null)
  let isGenerating = $state(false)
  let error = $state<string | null>(null)
  let initialized = $state(false)

  let sync: ReturnType<typeof createGallerySync> | null = null

  function addImageInternal(image: GalleryImage) {
    if (!images.some((img) => img.id === image.id)) {
      images = [image, ...images]
    }
  }

  function removeImageInternal(id: string) {
    images = images.filter((img) => img.id !== id)
    if (currentImage?.id === id) {
      currentImage = images[0] ?? null
    }
  }

  return {
    get images() {
      return images
    },
    get currentImage() {
      return currentImage
    },
    get isGenerating() {
      return isGenerating
    },
    get error() {
      return error
    },
    get isInitialized() {
      return initialized
    },

    async initialize() {
      if (initialized) return

      try {
        const persisted = await getAllImages()
        images = persisted
        currentImage = persisted[0] ?? null
      } catch (e) {
        console.error("Failed to load gallery from IndexedDB:", e)
      }

      sync = createGallerySync({
        onImageAdded: (image) => {
          addImageInternal(image)
        },
        onImageRemoved: (id) => {
          removeImageInternal(id)
        },
      })

      initialized = true
    },

    addImage(image: GalleryImage) {
      images = [image, ...images]
      currentImage = image

      addImageToDB(image).catch((e) =>
        console.error("Failed to persist image:", e),
      )

      sync?.broadcast({ type: "IMAGE_ADDED", payload: image })
    },

    setCurrentImage(image: GalleryImage) {
      currentImage = image
    },

    removeImage(id: string) {
      images = images.filter((img) => img.id !== id)
      if (currentImage?.id === id) {
        currentImage = images[0] ?? null
      }

      removeImageFromDB(id).catch((e) =>
        console.error("Failed to remove image from DB:", e),
      )

      sync?.broadcast({ type: "IMAGE_REMOVED", payload: { id } })
    },

    setGenerating(value: boolean) {
      isGenerating = value
    },

    setError(message: string | null) {
      error = message
    },

    clearError() {
      error = null
    },

    destroy() {
      sync?.destroy()
      sync = null
    },
  }
}

export const gallery = createGalleryStore()
