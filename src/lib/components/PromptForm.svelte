<!--
  @component Form for entering prompts and submitting generation requests.

  @example
  <PromptForm disabled={isLoading} />
-->
<script lang="ts">
  import { WandSparkles, RectangleVertical, RectangleHorizontal } from "@lucide/svelte"
  import SuggestionChips from "./SuggestionChips.svelte"
  import type { PageFormat } from "$lib/types"

  interface Props {
    disabled?: boolean
  }

  let { disabled = false }: Props = $props()

  const suggestions = [
    "A friendly dragon",
    "A magical unicorn",
    "A cute puppy",
    "A beautiful butterfly",
    "A space rocket",
    "A princess castle",
  ]

  let inputValue = $state("")
  let selectedFormat = $state<PageFormat>("portrait")

  function useSuggestion(suggestion: string) {
    inputValue = suggestion
  }
</script>

<div class="space-y-4">
  <div>
    <label
      for="prompt"
      class="mb-2 block font-display text-lg font-medium text-coral-700"
    >
      What would you like to color?
    </label>
    <input
      type="text"
      id="prompt"
      name="prompt"
      bind:value={inputValue}
      placeholder="e.g., A happy elephant playing in the jungle"
      required
      maxlength="200"
      {disabled}
      class="w-full rounded-2xl border-2 border-coral-200 bg-card p-4 text-lg text-foreground placeholder-muted-foreground transition-colors focus:border-coral-400 focus:outline-none disabled:bg-muted disabled:opacity-50"
    />
    <p class="mt-1 text-right text-sm text-muted-foreground">
      {inputValue.length}/200
    </p>
  </div>

  <SuggestionChips {suggestions} onselect={useSuggestion} {disabled} />

  <div>
    <span class="mb-2 block font-display text-sm font-medium text-coral-700">
      Page format
    </span>
    <div class="flex gap-3">
      <input type="hidden" name="format" value={selectedFormat} />

      <button
        type="button"
        onclick={() => (selectedFormat = "portrait")}
        {disabled}
        class="flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all disabled:opacity-50 {selectedFormat ===
        'portrait'
          ? 'bg-coral-100 text-coral-700 ring-2 ring-coral-400'
          : 'bg-mint-50 text-mint-600 hover:bg-mint-100'}"
        aria-pressed={selectedFormat === "portrait"}
      >
        <RectangleVertical class="h-8 w-6" strokeWidth={2} />
        <span class="text-xs font-medium">Portrait</span>
      </button>

      <button
        type="button"
        onclick={() => (selectedFormat = "landscape")}
        {disabled}
        class="flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all disabled:opacity-50 {selectedFormat ===
        'landscape'
          ? 'bg-coral-100 text-coral-700 ring-2 ring-coral-400'
          : 'bg-mint-50 text-mint-600 hover:bg-mint-100'}"
        aria-pressed={selectedFormat === "landscape"}
      >
        <RectangleHorizontal class="h-6 w-8" strokeWidth={2} />
        <span class="text-xs font-medium">Landscape</span>
      </button>
    </div>
  </div>

  <label
    class="flex cursor-pointer items-center gap-3 rounded-xl bg-mint-50 p-3 transition-colors hover:bg-mint-100"
  >
    <input
      type="checkbox"
      name="kidFriendly"
      {disabled}
      class="h-5 w-5 rounded border-coral-300 text-coral-500 focus:ring-coral-400"
    />
    <span class="text-mint-700">Kid-friendly (simpler, age-appropriate)</span>
  </label>

  <button
    type="submit"
    {disabled}
    class="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
  >
    <WandSparkles class="h-6 w-6" />
    {#if disabled}
      Creating...
    {:else}
      Create Coloring Page!
    {/if}
  </button>
</div>
