<!--
  @component Individual public gallery image card for landing pages.
  Shows a thumbnail with the prompt and links to create similar.

  @example
  <PublicGalleryItem {image} />
-->
<script lang="ts">
  import type { PublicGalleryImage } from "$lib/server/services/gallery"

  interface Props {
    image: PublicGalleryImage
  }

  let { image }: Props = $props()
</script>

<div class="group relative">
  <a
    href="/?prompt={encodeURIComponent(image.prompt)}"
    class="block w-full overflow-hidden rounded-xl border-2 border-coral-100 bg-white shadow-sm transition-all hover:border-coral-300 hover:shadow-md"
    title="Create similar: {image.prompt}"
  >
    <img
      src={image.blobUrl}
      alt="Coloring page: {image.prompt}"
      class="aspect-[3/4] w-full object-cover"
      loading="lazy"
    />
  </a>

  <p
    class="mt-2 line-clamp-2 text-center text-xs text-muted-foreground"
    title={image.prompt}
  >
    {image.prompt}
  </p>
</div>
