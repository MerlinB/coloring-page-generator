import type { GalleryImage } from "$lib/types"

export type GallerySyncMessage =
  | { type: "IMAGE_ADDED"; payload: GalleryImage }
  | { type: "IMAGE_REMOVED"; payload: { id: string } }

export interface GallerySyncCallbacks {
  onImageAdded: (image: GalleryImage) => void
  onImageRemoved: (id: string) => void
}

const CHANNEL_NAME = "gallery-sync"

export function createGallerySync(callbacks: GallerySyncCallbacks) {
  const channel = new BroadcastChannel(CHANNEL_NAME)

  channel.onmessage = (event: MessageEvent<GallerySyncMessage>) => {
    const message = event.data
    switch (message.type) {
      case "IMAGE_ADDED":
        callbacks.onImageAdded(message.payload)
        break
      case "IMAGE_REMOVED":
        callbacks.onImageRemoved(message.payload.id)
        break
    }
  }

  return {
    broadcast(message: GallerySyncMessage) {
      channel.postMessage(message)
    },
    destroy() {
      channel.close()
    },
  }
}
