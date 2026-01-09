<!--
  @component Input for redeeming a purchase code.

  @example
  <RedeemCode onsuccess={(balance) => handleRedeemed(balance)} />
-->
<script lang="ts">
  import { Ticket, Check, AlertCircle } from "@lucide/svelte"
  import { fingerprintStore } from "$lib/stores/fingerprint.svelte"
  import { usageStore } from "$lib/stores/usage.svelte"
  import * as m from "$lib/paraglide/messages"

  interface Props {
    onsuccess?: (balance: number) => void
  }

  let { onsuccess }: Props = $props()

  let code = $state("")
  let loading = $state(false)
  let error = $state<string | null>(null)
  let success = $state(false)

  // Format code as user types: COLOR-XXXX-XXXX
  function formatCode(input: string): string {
    // Remove everything except alphanumeric
    const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "")

    // Add prefix if not present
    let withPrefix = clean
    if (!clean.startsWith("COLOR")) {
      withPrefix = "COLOR" + clean
    }

    // Format with dashes
    if (withPrefix.length <= 5) return withPrefix
    if (withPrefix.length <= 9)
      return `${withPrefix.slice(0, 5)}-${withPrefix.slice(5)}`
    return `${withPrefix.slice(0, 5)}-${withPrefix.slice(5, 9)}-${withPrefix.slice(9, 13)}`
  }

  function handleInput(e: Event) {
    const input = (e.target as HTMLInputElement).value
    code = formatCode(input)
    // Reset states on new input
    error = null
    success = false
  }

  async function handleSubmit() {
    const cleanCode = code.replace(/-/g, "")
    if (cleanCode.length < 13) {
      // COLOR + 8 chars
      error = m.redeem_error_incomplete()
      return
    }

    if (!fingerprintStore.fingerprint) {
      error = m.redeem_error_device()
      return
    }

    loading = true
    error = null
    success = false

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          fingerprint: fingerprintStore.fingerprint,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        error = data.error ?? m.redeem_error_failed()
        return
      }

      success = true
      usageStore.setTokenBalance(
        data.totalBalance,
        data.code,
        data.activeCodes ?? [],
      )
      onsuccess?.(data.totalBalance)
    } catch {
      error = m.redeem_error_generic()
    } finally {
      loading = false
    }
  }
</script>

<div class="rounded-2xl bg-lavender-50 p-4">
  <div class="mb-3 flex items-center gap-2">
    <Ticket class="h-5 w-5 text-lavender-600" />
    <span class="font-display font-semibold text-lavender-800"
      >{m.redeem_title()}</span
    >
  </div>

  <form
    onsubmit={(e) => {
      e.preventDefault()
      handleSubmit()
    }}
  >
    <div class="flex gap-2">
      <input
        type="text"
        value={code}
        oninput={handleInput}
        placeholder={m.redeem_placeholder()}
        maxlength="15"
        disabled={loading || success}
        class="flex-1 rounded-xl border-2 border-lavender-200 bg-white px-3 py-2
          font-mono text-sm tracking-wider uppercase
          focus:border-lavender-400 focus:outline-none
          disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading || success || code.length < 15}
        class="rounded-xl bg-lavender-500 px-4 py-2 font-medium text-white
          transition-colors hover:bg-lavender-600
          disabled:cursor-not-allowed disabled:bg-lavender-300"
      >
        {#if loading}
          ...
        {:else if success}
          <Check class="h-5 w-5" />
        {:else}
          {m.redeem_button()}
        {/if}
      </button>
    </div>
  </form>

  {#if error}
    <div class="mt-2 flex items-center gap-1 text-sm text-coral-600">
      <AlertCircle class="h-4 w-4" />
      {error}
    </div>
  {/if}

  {#if success}
    <div class="mt-2 flex items-center gap-1 text-sm text-success">
      <Check class="h-4 w-4" />
      {m.redeem_success()}
    </div>
  {/if}
</div>
