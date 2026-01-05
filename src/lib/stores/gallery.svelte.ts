import type { GalleryImage } from "$lib/types"

function createGalleryStore() {
  let images = $state<GalleryImage[]>([])
  let currentImage = $state<GalleryImage | null>(null)
  let isGenerating = $state(false)
  let error = $state<string | null>(null)

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

    addImage(image: GalleryImage) {
      images = [image, ...images]
      currentImage = image
    },

    setCurrentImage(image: GalleryImage) {
      currentImage = image
    },

    removeImage(id: string) {
      images = images.filter((img) => img.id !== id)
      if (currentImage?.id === id) {
        currentImage = images[0] ?? null
      }
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
  }
}

export const gallery = createGalleryStore()
