import { browser } from "$app/environment"
import {
  getCodeStrings,
  addCodeToDB,
  removeCodeFromDB,
  hasCodeInDB,
  createCodesSync,
} from "$lib/db"

function createCodesStore() {
  let codes = $state<string[]>([])
  let initialized = $state(false)
  let loading = $state(true)

  let sync: ReturnType<typeof createCodesSync> | null = null

  function addCodeInternal(code: string) {
    if (!codes.includes(code)) {
      codes = [...codes, code]
    }
  }

  function removeCodeInternal(code: string) {
    codes = codes.filter((c) => c !== code)
  }

  return {
    get codes() {
      return codes
    },
    get initialized() {
      return initialized
    },
    get loading() {
      return loading
    },

    async initialize() {
      if (!browser || initialized) return

      loading = true
      try {
        const stored = await getCodeStrings()
        codes = stored
      } catch (e) {
        console.error("Failed to load codes from IndexedDB:", e)
      }

      sync = createCodesSync({
        onCodeAdded: (code) => {
          addCodeInternal(code)
        },
        onCodeRemoved: (code) => {
          removeCodeInternal(code)
        },
      })

      initialized = true
      loading = false
    },

    async addCode(code: string) {
      // Check if already exists
      if (codes.includes(code)) {
        return
      }

      // Add to state
      codes = [...codes, code]

      // Persist to IndexedDB
      addCodeToDB(code).catch((e) =>
        console.error("Failed to persist code:", e),
      )

      // Broadcast to other tabs
      sync?.broadcast({ type: "CODE_ADDED", payload: { code } })
    },

    async removeCode(code: string) {
      // Remove from state
      codes = codes.filter((c) => c !== code)

      // Remove from IndexedDB
      removeCodeFromDB(code).catch((e) =>
        console.error("Failed to remove code from DB:", e),
      )

      // Broadcast to other tabs
      sync?.broadcast({ type: "CODE_REMOVED", payload: { code } })
    },

    hasCode(code: string): boolean {
      return codes.includes(code)
    },

    destroy() {
      sync?.destroy()
      sync = null
    },
  }
}

export const codesStore = createCodesStore()
