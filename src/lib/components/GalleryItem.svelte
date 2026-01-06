<!--
  @component Individual gallery thumbnail with select and delete actions.

  @example
  <GalleryItem {image} onselect={() => selectImage()} ondelete={() => deleteImage()} />
-->
<script lang="ts">
  import { X } from "@lucide/svelte"
  import type { GalleryImage } from "$lib/types"

  interface Props {
    image: GalleryImage
    onselect: () => void
    ondelete: () => void
  }

  let { image, onselect, ondelete }: Props = $props()
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

  <button
    type="button"
    onclick={() => ondelete()}
    class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100"
    title="Delete"
  >
    <X class="h-4 w-4" />
  </button>

  <p class="mt-1 truncate text-center text-xs text-muted-foreground">
    {image.prompt}
  </p>
</div>
