<!--
  @component Grid display of all generated coloring pages.

  @example
  <Gallery
    images={gallery.images}
    onselect={(image) => gallery.setCurrentImage(image)}
    ondelete={(id) => gallery.removeImage(id)}
  />
-->
<script lang="ts">
  import type { GalleryImage } from "$lib/types"
  import GalleryItem from "./GalleryItem.svelte"

  interface Props {
    images: GalleryImage[]
    onselect: (image: GalleryImage) => void
    ondelete: (id: string) => void
  }

  let { images, onselect, ondelete }: Props = $props()
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
  {#each images as image (image.id)}
    <GalleryItem
      {image}
      onselect={() => onselect(image)}
      ondelete={() => ondelete(image.id)}
    />
  {/each}
</div>
