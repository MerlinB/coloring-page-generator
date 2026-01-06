import { openDB, type IDBPDatabase, type DBSchema } from "idb"
import type { GalleryImage } from "$lib/types"

interface GalleryDBSchema extends DBSchema {
  images: {
    key: string
    value: GalleryImage
    indexes: {
      "by-createdAt": Date
    }
  }
}

const DB_NAME = "coloring-pages-gallery"
const DB_VERSION = 1
const STORE_NAME = "images"

let dbPromise: Promise<IDBPDatabase<GalleryDBSchema>> | null = null

export function openGalleryDB(): Promise<IDBPDatabase<GalleryDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<GalleryDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("by-createdAt", "createdAt")
      },
    })
  }
  return dbPromise
}

export async function getAllImages(): Promise<GalleryImage[]> {
  const db = await openGalleryDB()
  const all = await db.getAllFromIndex(STORE_NAME, "by-createdAt")
  return all.reverse()
}

export async function addImageToDB(image: GalleryImage): Promise<void> {
  const db = await openGalleryDB()
  await db.put(STORE_NAME, image)
}

export async function removeImageFromDB(id: string): Promise<void> {
  const db = await openGalleryDB()
  await db.delete(STORE_NAME, id)
}
