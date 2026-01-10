<!--
  @component Individual public gallery image card for landing pages.
  Shows a thumbnail with the prompt. Clicking opens the lightbox.

  @example
  <PublicGalleryItem {image} onselect={(img) => openLightbox(img)} />
-->
<script lang="ts">
  import type { PublicGalleryImage } from "$lib/server/services/gallery"

  interface Props {
    image: PublicGalleryImage
    onselect: (image: PublicGalleryImage) => void
  }

  let { image, onselect }: Props = $props()
</script>

<div class="group relative">
  <button
    type="button"
    onclick={() => onselect(image)}
    class="block w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-coral-100 bg-white shadow-sm transition-all hover:border-coral-300 hover:shadow-md"
    title={image.prompt}
  >
    <img
      src={image.blobUrl}
      alt="Coloring page: {image.prompt}"
      class="aspect-[3/4] w-full object-cover"
      loading="lazy"
    />
  </button>

  <p
    class="mt-2 line-clamp-2 text-center text-xs text-muted-foreground"
    title={image.prompt}
  >
    {image.prompt}
  </p>
</div>
