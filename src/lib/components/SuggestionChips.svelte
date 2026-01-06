<!--
  @component Displays clickable suggestion chips for prompt ideas.

  @example
  <SuggestionChips
    suggestions={["A dragon", "A unicorn"]}
    onselect={(s) => console.log(s)}
  />
-->
<script lang="ts">
  interface Props {
    suggestions: string[]
    onselect: (suggestion: string) => void
    disabled?: boolean
  }

  let { suggestions, onselect, disabled = false }: Props = $props()
</script>

<div class="flex flex-wrap gap-2">
  <span class="text-sm text-muted-foreground">Try:</span>
  {#each suggestions as suggestion (suggestion)}
    <button
      type="button"
      onclick={() => onselect(suggestion)}
      {disabled}
      class="rounded-full bg-lavender-50 px-3 py-1 text-sm text-lavender-600 transition-colors hover:bg-lavender-100 disabled:opacity-50"
    >
      {suggestion}
    </button>
  {/each}
</div>
