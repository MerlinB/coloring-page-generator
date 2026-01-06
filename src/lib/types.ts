export type PageFormat = "portrait" | "landscape"

export interface GalleryImage {
  id: string
  prompt: string
  imageData: string // base64 encoded
  createdAt: Date
  format?: PageFormat
}

export interface GenerationResult {
  success: boolean
  imageData?: string
  error?: string
}
