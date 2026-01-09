import { browser } from "$app/environment"
import { FREE_TIER_LIMIT } from "$lib/constants"
import { codesStore } from "./codes.svelte"

export interface CodeBalance {
  code: string
  remainingTokens: number
}

export interface UsageState {
  freeRemaining: number
  tokenBalance: number
  weekResetDate: string | null
  activeCode: string | null
  activeCodes: CodeBalance[]
}

type UsageSyncMessage = { type: "USAGE_UPDATED"; payload: UsageState }

const CHANNEL_NAME = "usage-sync"

function createUsageStore() {
  let state = $state<UsageState>({
    freeRemaining: FREE_TIER_LIMIT,
    tokenBalance: 0,
    weekResetDate: null,
    activeCode: null,
    activeCodes: [],
  })
  let loading = $state(true)
  let error = $state<string | null>(null)

  let channel: BroadcastChannel | null = null
  let visibilityHandler: (() => void) | null = null

  function setupSync() {
    if (!browser || channel) return

    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (event: MessageEvent<UsageSyncMessage>) => {
      const message = event.data
      if (message.type === "USAGE_UPDATED") {
        state = message.payload
      }
    }

    // Refresh usage when tab becomes visible
    visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        // Silently refresh usage in background with current codes
        fetchUsageWithCodes(codesStore.codes)
          .then((data) => {
            if (data) state = data
          })
          .catch(() => {
            // Ignore errors on background refresh
          })
      }
    }
    document.addEventListener("visibilitychange", visibilityHandler)
  }

  function broadcast(message: UsageSyncMessage) {
    channel?.postMessage(message)
  }

  async function fetchUsageWithCodes(
    codes: string[],
  ): Promise<UsageState | null> {
    const res = await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes }),
    })
    if (!res.ok) return null
    return res.json()
  }

  return {
    get state() {
      return state
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },

    get canGenerate() {
      return state.tokenBalance > 0 || state.freeRemaining > 0
    },

    get usingTokens() {
      return state.tokenBalance > 0
    },

    get remainingCount() {
      return state.tokenBalance > 0 ? state.tokenBalance : state.freeRemaining
    },

    async fetchUsage() {
      if (!browser) return

      setupSync()
      loading = true
      error = null

      try {
        // Get codes from the codes store
        const codes = codesStore.codes
        const data = await fetchUsageWithCodes(codes)

        if (!data) throw new Error("Failed to fetch usage")

        state = data
        broadcast({ type: "USAGE_UPDATED", payload: data })
      } catch (e) {
        console.error("Usage fetch error:", e)
        error = "Could not load usage data"
      } finally {
        loading = false
      }
    },

    decrementUsage() {
      // Bounds checking to prevent negative values
      if (state.tokenBalance > 0) {
        state = {
          ...state,
          tokenBalance: Math.max(0, state.tokenBalance - 1),
        }
      } else if (state.freeRemaining > 0) {
        state = {
          ...state,
          freeRemaining: Math.max(0, state.freeRemaining - 1),
        }
      }
      // Broadcast update
      if (state.tokenBalance >= 0 && state.freeRemaining >= 0) {
        broadcast({ type: "USAGE_UPDATED", payload: state })
      }
    },

    updateFromServer(data: UsageState) {
      state = data
      broadcast({ type: "USAGE_UPDATED", payload: data })
    },

    destroy() {
      channel?.close()
      channel = null
      if (visibilityHandler) {
        document.removeEventListener("visibilitychange", visibilityHandler)
        visibilityHandler = null
      }
    },
  }
}

export const usageStore = createUsageStore()
