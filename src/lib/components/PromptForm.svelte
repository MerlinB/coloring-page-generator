<!--
  @component Form for entering prompts and submitting generation requests.

  @example
  <PromptForm disabled={isLoading} />
-->
<script lang="ts">
  import {
    WandSparkles,
    RectangleVertical,
    RectangleHorizontal,
  } from "@lucide/svelte"
  import SuggestionChips from "./SuggestionChips.svelte"
  import type { PageFormat } from "$lib/types"
  import * as m from "$lib/paraglide/messages"

  interface Props {
    disabled?: boolean
  }

  let { disabled = false }: Props = $props()

  const suggestions = $derived([
    m.suggestion_dragon(),
    m.suggestion_unicorn(),
    m.suggestion_puppy(),
    m.suggestion_butterfly(),
    m.suggestion_rocket(),
    m.suggestion_castle(),
  ])

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
      {m.prompt_label()}
    </label>
    <input
      type="text"
      id="prompt"
      name="prompt"
      bind:value={inputValue}
      placeholder={m.prompt_placeholder()}
      required
      maxlength="2000"
      {disabled}
      class="w-full rounded-2xl border-2 border-coral-200 bg-card p-4 text-lg text-foreground placeholder-muted-foreground transition-colors focus:border-coral-400 focus:outline-none disabled:bg-muted disabled:opacity-50"
    />
  </div>

  <SuggestionChips {suggestions} onselect={useSuggestion} {disabled} />

  <div>
    <span class="mb-2 block font-display text-sm font-medium text-coral-700">
      {m.prompt_format_label()}
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
          : 'bg-gold-50 text-gold-600 hover:bg-gold-100'}"
        aria-pressed={selectedFormat === "portrait"}
      >
        <RectangleVertical class="h-8 w-6" strokeWidth={2} />
        <span class="text-xs font-medium">{m.prompt_format_portrait()}</span>
      </button>

      <button
        type="button"
        onclick={() => (selectedFormat = "landscape")}
        {disabled}
        class="flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all disabled:opacity-50 {selectedFormat ===
        'landscape'
          ? 'bg-coral-100 text-coral-700 ring-2 ring-coral-400'
          : 'bg-gold-50 text-gold-600 hover:bg-gold-100'}"
        aria-pressed={selectedFormat === "landscape"}
      >
        <RectangleHorizontal class="h-6 w-8" strokeWidth={2} />
        <span class="text-xs font-medium">{m.prompt_format_landscape()}</span>
      </button>
    </div>
  </div>

  <!-- Hidden for now - images are generally good enough without this option -->
  <label
    class="hidden cursor-pointer items-center gap-3 rounded-xl bg-gold-50 p-3 transition-colors hover:bg-gold-100"
  >
    <input
      type="checkbox"
      name="kidFriendly"
      {disabled}
      class="h-5 w-5 rounded border-coral-300 text-coral-500 focus:ring-coral-400"
    />
    <span class="text-gold-700">{m.prompt_kid_friendly()}</span>
  </label>

  <button
    type="submit"
    {disabled}
    class="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-xl font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
  >
    <WandSparkles class="h-6 w-6" />
    {#if disabled}
      {m.prompt_submitting()}
    {:else}
      {m.prompt_submit()}
    {/if}
  </button>
</div>
