<!--
  @component Individual gallery thumbnail with expand, edit, and delete actions.

  @example
  <GalleryItem
    {image}
    onexpand={() => openLightbox()}
    ondelete={() => deleteImage()}
  />
-->
<script lang="ts">
  import { X, Pencil } from "@lucide/svelte"
  import type { GalleryImage } from "$lib/types"

  interface Props {
    image: GalleryImage
    onexpand: () => void
    ondelete: () => void
    onedit?: () => void
  }

  let { image, onexpand, ondelete, onedit }: Props = $props()
</script>

<div class="group relative">
  <button
    type="button"
    onclick={() => onexpand()}
    class="block w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-coral-100 bg-white shadow-sm transition-all hover:border-coral-300 hover:shadow-md"
    title="View full size"
    aria-label="View full size"
  >
    <img
      src="data:image/png;base64,{image.imageData}"
      alt="Coloring page: {image.prompt}"
      class="aspect-square w-full object-cover"
    />
  </button>

  <!-- Edit button -->
  {#if onedit}
    <button
      type="button"
      onclick={() => onedit()}
      class="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lavender-600 opacity-0 shadow-md transition-all group-hover:opacity-100 hover:scale-110 hover:bg-white"
      title="Edit"
      aria-label="Edit"
    >
      <Pencil class="h-4 w-4" />
    </button>
  {/if}

  <!-- Delete button -->
  <button
    type="button"
    onclick={() => ondelete()}
    class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100"
    title="Delete"
    aria-label="Delete"
  >
    <X class="h-4 w-4" />
  </button>

  <p class="mt-1 truncate text-center text-xs text-muted-foreground">
    {image.prompt}
  </p>
</div>
