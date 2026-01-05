export interface GalleryImage {
  id: string
  prompt: string
  imageData: string // base64 encoded
  createdAt: Date
}

export interface GenerationResult {
  success: boolean
  imageData?: string
  error?: string
}
