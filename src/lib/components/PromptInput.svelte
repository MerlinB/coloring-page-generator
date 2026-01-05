<script lang="ts">
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

  function useSuggestion(suggestion: string) {
    inputValue = suggestion
  }
</script>

<div class="space-y-4">
  <div>
    <label for="prompt" class="mb-2 block text-lg font-medium text-purple-700">
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
      class="w-full rounded-2xl border-4 border-purple-300 p-4 text-lg text-purple-900 placeholder-purple-300 transition-colors focus:border-purple-500 focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
    />
    <p class="mt-1 text-right text-sm text-purple-400">
      {inputValue.length}/200
    </p>
  </div>

  <div class="flex flex-wrap gap-2">
    <span class="text-sm text-purple-600">Try:</span>
    {#each suggestions as suggestion (suggestion)}
      <button
        type="button"
        onclick={() => useSuggestion(suggestion)}
        {disabled}
        class="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-600 transition-colors hover:bg-purple-200 disabled:opacity-50"
      >
        {suggestion}
      </button>
    {/each}
  </div>

  <label
    class="flex cursor-pointer items-center gap-3 rounded-xl bg-purple-50 p-3 transition-colors hover:bg-purple-100"
  >
    <input
      type="checkbox"
      name="kidFriendly"
      {disabled}
      class="h-5 w-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
    />
    <span class="text-purple-700">Kid-friendly (simpler, age-appropriate)</span>
  </label>

  <button
    type="submit"
    {disabled}
    class="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
  >
    {#if disabled}
      Creating...
    {:else}
      Create Coloring Page!
    {/if}
  </button>
</div>
