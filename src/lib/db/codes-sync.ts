export type CodesSyncMessage =
  | { type: "CODE_ADDED"; payload: { code: string } }
  | { type: "CODE_REMOVED"; payload: { code: string } }

export interface CodesSyncCallbacks {
  onCodeAdded: (code: string) => void
  onCodeRemoved: (code: string) => void
}

const CHANNEL_NAME = "codes-sync"

export function createCodesSync(callbacks: CodesSyncCallbacks) {
  const channel = new BroadcastChannel(CHANNEL_NAME)

  channel.onmessage = (event: MessageEvent<CodesSyncMessage>) => {
    const message = event.data
    switch (message.type) {
      case "CODE_ADDED":
        callbacks.onCodeAdded(message.payload.code)
        break
      case "CODE_REMOVED":
        callbacks.onCodeRemoved(message.payload.code)
        break
    }
  }

  return {
    broadcast(message: CodesSyncMessage) {
      channel.postMessage(message)
    },
    destroy() {
      channel.close()
    },
  }
}
