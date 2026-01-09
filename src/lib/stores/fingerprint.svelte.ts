import { browser } from "$app/environment"

function createFingerprintStore() {
  let fingerprint = $state<string | null>(null)
  let loading = $state(true)
  let initialized = $state(false)

  return {
    get fingerprint() {
      return fingerprint
    },
    get loading() {
      return loading
    },
    get isInitialized() {
      return initialized
    },

    /**
     * Initialize with server-provided fingerprint.
     * No longer uses FingerprintJS or localStorage.
     */
    initialize(serverFingerprint: string) {
      if (!browser || initialized) return

      fingerprint = serverFingerprint
      loading = false
      initialized = true
    },
  }
}

export const fingerprintStore = createFingerprintStore()
