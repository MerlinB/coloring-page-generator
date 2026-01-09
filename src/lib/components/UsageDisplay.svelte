<!--
  @component Displays current usage status (free tier or token balance).

  @example
  <UsageDisplay onpurchase={() => showPurchaseModal = true} />
-->
<script lang="ts">
  import { Sparkles, Clock, Plus } from "@lucide/svelte"
  import { usageStore } from "$lib/stores/usage.svelte"
  import * as m from "$lib/paraglide/messages"

  interface Props {
    onpurchase?: () => void
  }

  let { onpurchase }: Props = $props()

  function formatResetTime(isoDate: string | null): string {
    if (!isoDate) return ""
    const reset = new Date(isoDate)
    const now = new Date()
    const diffMs = reset.getTime() - now.getTime()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (days <= 0) return m.usage_today()
    if (days === 1) return m.usage_tomorrow()
    return m.usage_in_days({ days: String(days) })
  }
</script>

<div class="rounded-2xl bg-gold-50 p-4">
  {#if usageStore.loading}
    <div class="h-6 w-32 animate-pulse rounded bg-gold-200"></div>
  {:else if usageStore.usingTokens}
    <!-- Token balance display -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Sparkles class="h-5 w-5 text-gold-600" />
        <span class="font-display font-semibold text-gold-800">
          {m.usage_images_remaining({
            count: String(usageStore.state.tokenBalance),
          })}
        </span>
      </div>
      {#if onpurchase}
        <button
          type="button"
          onclick={() => onpurchase?.()}
          class="flex items-center gap-1 rounded-full bg-gold-200 px-3 py-1 text-sm font-medium text-gold-800 transition-colors hover:bg-gold-300 active:scale-[0.98]"
        >
          <Plus class="h-4 w-4" />
          <span>{m.usage_get_more()}</span>
        </button>
      {/if}
    </div>
    {#if usageStore.state.activeCodes.length > 0}
      <div class="group relative mt-1 inline-block">
        <p class="cursor-default text-sm text-gold-600">
          {#if usageStore.state.activeCodes.length === 1}
            {m.usage_code_label({ code: usageStore.state.activeCodes[0].code })}
          {:else}
            <span class="underline decoration-dotted underline-offset-2">
              {m.usage_codes_count({
                count: String(usageStore.state.activeCodes.length),
              })}
            </span>
          {/if}
        </p>
        {#if usageStore.state.activeCodes.length > 1}
          <!-- Tooltip with code breakdown -->
          <div
            class="pointer-events-none absolute bottom-full left-0 z-10 mb-2 min-w-48 rounded-lg bg-gold-800 p-3 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            <p class="mb-2 font-semibold">{m.usage_your_codes()}</p>
            <ul class="space-y-1">
              {#each usageStore.state.activeCodes as codeInfo (codeInfo.code)}
                <li class="flex justify-between gap-4">
                  <span class="font-mono text-xs">{codeInfo.code}</span>
                  <span class="text-gold-200">{codeInfo.remainingTokens}</span>
                </li>
              {/each}
            </ul>
            <!-- Tooltip arrow -->
            <div
              class="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-gold-800"
            ></div>
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <!-- Free tier display -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Sparkles class="h-5 w-5 text-gold-600" />
        <span class="font-display font-semibold text-gold-800">
          {m.usage_free_remaining({
            remaining: String(usageStore.state.freeRemaining),
          })}
        </span>
      </div>
      {#if onpurchase}
        <button
          type="button"
          onclick={() => onpurchase?.()}
          class="flex items-center gap-1 rounded-full bg-gold-200 px-3 py-1 text-sm font-medium text-gold-800 transition-colors hover:bg-gold-300 active:scale-[0.98]"
        >
          <Plus class="h-4 w-4" />
          <span>{m.usage_get_more()}</span>
        </button>
      {/if}
    </div>
    {#if usageStore.state.weekResetDate}
      <div class="mt-1 flex items-center gap-1 text-sm text-gold-600">
        <Clock class="h-4 w-4" />
        <span
          >{m.usage_resets({
            time: formatResetTime(usageStore.state.weekResetDate),
          })}</span
        >
      </div>
    {/if}
  {/if}
</div>
