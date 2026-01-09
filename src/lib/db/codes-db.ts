import { openDB, type IDBPDatabase, type DBSchema } from "idb"

export interface StoredCode {
  code: string
  redeemedAt: string
}

interface CodesDBSchema extends DBSchema {
  codes: {
    key: string
    value: StoredCode
    indexes: {
      "by-redeemedAt": string
    }
  }
}

const DB_NAME = "coloring-pages-codes"
const DB_VERSION = 1
const STORE_NAME = "codes"

let dbPromise: Promise<IDBPDatabase<CodesDBSchema>> | null = null

export function openCodesDB(): Promise<IDBPDatabase<CodesDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<CodesDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "code" })
        store.createIndex("by-redeemedAt", "redeemedAt")
      },
    })
  }
  return dbPromise
}

export async function getAllCodes(): Promise<StoredCode[]> {
  const db = await openCodesDB()
  const all = await db.getAllFromIndex(STORE_NAME, "by-redeemedAt")
  return all.reverse()
}

export async function getCodeStrings(): Promise<string[]> {
  const codes = await getAllCodes()
  return codes.map((c) => c.code)
}

export async function addCodeToDB(code: string): Promise<void> {
  const db = await openCodesDB()
  await db.put(STORE_NAME, {
    code,
    redeemedAt: new Date().toISOString(),
  })
}

export async function removeCodeFromDB(code: string): Promise<void> {
  const db = await openCodesDB()
  await db.delete(STORE_NAME, code)
}

export async function hasCodeInDB(code: string): Promise<boolean> {
  const db = await openCodesDB()
  const existing = await db.get(STORE_NAME, code)
  return !!existing
}
