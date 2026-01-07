<!--
  @component Grid display of all generated coloring pages.

  @example
  <Gallery
    images={gallery.images}
    onselect={(image) => gallery.setCurrentImage(image)}
    onlightbox={(index) => openLightbox(index)}
    ondelete={(id) => gallery.removeImage(id)}
  />
-->
<script lang="ts">
  import type { GalleryImage } from "$lib/types"
  import GalleryItem from "./GalleryItem.svelte"

  interface Props {
    images: GalleryImage[]
    onselect: (image: GalleryImage) => void
    onlightbox?: (index: number) => void
    ondelete: (id: string) => void
    onedit?: (image: GalleryImage) => void
  }

  let { images, onselect, onlightbox, ondelete, onedit }: Props = $props()
</script>

<div
  class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
>
  {#each images as image, index (image.id)}
    <GalleryItem
      {image}
      onselect={() => onselect(image)}
      onexpand={onlightbox ? () => onlightbox(index) : undefined}
      ondelete={() => ondelete(image.id)}
      onedit={onedit ? () => onedit(image) : undefined}
    />
  {/each}
</div>
