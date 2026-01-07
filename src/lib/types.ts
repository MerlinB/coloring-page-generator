export type PageFormat = "portrait" | "landscape"

export interface GalleryImage {
  id: string
  prompt: string
  imageData: string // base64 encoded
  createdAt: Date
  format?: PageFormat
  sourceImageId?: string // ID of original image if this was edited from another
  editPrompt?: string // The edit instruction used
}

export interface GenerationResult {
  success: boolean
  imageData?: string
  error?: string
}
