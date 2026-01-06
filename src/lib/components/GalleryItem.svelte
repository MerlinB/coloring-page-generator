<!--
  @component Individual gallery thumbnail with select, expand, and delete actions.

  @example
  <GalleryItem
    {image}
    onselect={() => selectImage()}
    onexpand={() => openLightbox()}
    ondelete={() => deleteImage()}
  />
-->
<script lang="ts">
  import { X, Maximize2 } from "@lucide/svelte"
  import type { GalleryImage } from "$lib/types"

  interface Props {
    image: GalleryImage
    onselect: () => void
    onexpand?: () => void
    ondelete: () => void
  }

  let { image, onselect, onexpand, ondelete }: Props = $props()
</script>

<div class="group relative">
  <button
    type="button"
    onclick={() => onselect()}
    class="block w-full overflow-hidden rounded-xl border-2 border-coral-100 bg-white shadow-sm transition-all hover:border-coral-300 hover:shadow-md"
  >
    <img
      src="data:image/png;base64,{image.imageData}"
      alt="Coloring page: {image.prompt}"
      class="aspect-square w-full object-cover"
    />
  </button>

  <!-- Expand button (opens lightbox) -->
  {#if onexpand}
    <button
      type="button"
      onclick={() => onexpand()}
      class="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-coral-600 opacity-0 shadow-md transition-all hover:bg-white hover:scale-110 group-hover:opacity-100"
      title="View full size"
      aria-label="View full size"
    >
      <Maximize2 class="h-4 w-4" />
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
