<!--
  @component Modal for entering edit instructions for an existing coloring page.

  @example
  <EditPromptModal
    open={true}
    image={selectedImage}
    disabled={isEditing}
    onsubmit={(editPrompt) => handleEdit(editPrompt)}
    onclose={() => closeModal()}
  />
-->
<script lang="ts">
  import { X, Sparkles } from "@lucide/svelte"
  import type { GalleryImage } from "$lib/types"
  import { untrack } from "svelte"

  interface Props {
    open: boolean
    image: GalleryImage | null
    disabled?: boolean
    onsubmit: (editPrompt: string) => void
    onclose: () => void
  }

  let { open, image, disabled = false, onsubmit, onclose }: Props = $props()

  let editPrompt = $state("")
  let dialogEl: HTMLDivElement | undefined = $state()
  let inputEl: HTMLInputElement | undefined = $state()
  let previouslyFocused: Element | null = null

  const editSuggestions = [
    "Add a butterfly",
    "Make lines thicker",
    "Add flowers",
    "Add a rainbow",
    "Make it simpler",
    "Add stars",
  ]

  function handleSubmit() {
    if (editPrompt.trim()) {
      onsubmit(editPrompt.trim())
    }
  }

  function useSuggestion(suggestion: string) {
    editPrompt = suggestion
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onclose()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onclose()
    }
  }

  // Focus management and scroll lock
  $effect(() => {
    if (open) {
      // Store previously focused element
      previouslyFocused = document.activeElement

      // Lock body scroll
      document.body.style.overflow = "hidden"

      // Focus the input after a short delay
      untrack(() => {
        setTimeout(() => inputEl?.focus(), 50)
      })
    }

    return () => {
      if (open) {
        // Restore body scroll
        document.body.style.overflow = ""

        // Restore focus
        if (previouslyFocused instanceof HTMLElement) {
          previouslyFocused.focus()
        }
      }
    }
  })

  // Reset prompt when modal closes
  $effect(() => {
    if (!open) {
      editPrompt = ""
    }
  })
</script>

<svelte:window onkeydown={(e) => open && handleKeydown(e)} />

{#if open && image}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onclick={(e) => handleBackdropClick(e)}
    role="presentation"
  >
    <div
      bind:this={dialogEl}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      tabindex="-1"
      class="w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl outline-none"
    >
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h2
          id="edit-modal-title"
          class="font-display text-xl font-bold text-coral-700"
        >
          Edit Your Coloring Page
        </h2>
        <button
          type="button"
          onclick={() => onclose()}
          class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Preview thumbnail -->
      <div class="mb-4 flex justify-center">
        <img
          src="data:image/png;base64,{image.imageData}"
          alt="Coloring page to edit"
          class="h-32 w-auto rounded-xl border-2 border-coral-100"
        />
      </div>

      <!-- Edit prompt input -->
      <div class="space-y-3">
        <label
          for="edit-prompt"
          class="block font-display text-sm font-medium text-coral-700"
        >
          What would you like to change?
        </label>
        <input
          type="text"
          id="edit-prompt"
          bind:this={inputEl}
          bind:value={editPrompt}
          placeholder="e.g., Add a butterfly, make lines thicker"
          maxlength="200"
          {disabled}
          onkeydown={(e) => {
            if (e.key === "Enter" && !disabled && editPrompt.trim()) {
              handleSubmit()
            }
          }}
          class="w-full rounded-xl border-2 border-coral-200 bg-background p-3 text-foreground placeholder-muted-foreground transition-colors focus:border-coral-400 focus:outline-none disabled:opacity-50"
        />
        <p class="text-right text-xs text-muted-foreground">
          {editPrompt.length}/200
        </p>

        <!-- Quick suggestions -->
        <div class="flex flex-wrap gap-2">
          {#each editSuggestions as suggestion (suggestion)}
            <button
              type="button"
              onclick={() => useSuggestion(suggestion)}
              {disabled}
              class="rounded-full bg-lavender-50 px-3 py-1.5 text-sm text-lavender-600 transition-colors hover:bg-lavender-100 disabled:opacity-50"
            >
              {suggestion}
            </button>
          {/each}
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex gap-3">
        <button
          type="button"
          onclick={() => onclose()}
          {disabled}
          class="flex-1 rounded-full border-2 border-coral-200 px-4 py-3 font-bold text-coral-600 transition-colors hover:bg-coral-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={() => handleSubmit()}
          disabled={disabled || !editPrompt.trim()}
          class="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Sparkles class="h-5 w-5" />
          {#if disabled}
            Editing...
          {:else}
            Apply Edit
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
