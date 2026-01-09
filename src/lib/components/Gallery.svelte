<!--
  @component Grid display of all generated coloring pages with "load more" pagination.

  @example
  <Gallery
    images={gallery.images}
    onselect={(index) => openLightbox(index)}
    ondelete={(id) => gallery.removeImage(id)}
  />
-->
<script lang="ts">
  import type { GalleryImage } from "$lib/types"
  import * as m from "$lib/paraglide/messages"
  import GalleryItem from "./GalleryItem.svelte"

  const ITEMS_PER_PAGE = 30

  interface Props {
    images: GalleryImage[]
    onselect: (index: number) => void
    ondelete: (id: string) => void
    onedit?: (image: GalleryImage) => void
  }

  let { images, onselect, ondelete, onedit }: Props = $props()

  let visibleCount = $state(ITEMS_PER_PAGE)

  const visibleImages = $derived(images.slice(0, visibleCount))
  const hasMore = $derived(images.length > visibleCount)
  const remaining = $derived(images.length - visibleCount)

  function loadMore() {
    visibleCount += ITEMS_PER_PAGE
  }
</script>

<div
  class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
>
  {#each visibleImages as image, index (image.id)}
    <GalleryItem
      {image}
      onexpand={() => onselect(index)}
      ondelete={() => ondelete(image.id)}
      onedit={onedit ? () => onedit(image) : undefined}
    />
  {/each}
</div>

{#if hasMore}
  <div class="mt-6 flex justify-center">
    <button
      type="button"
      onclick={() => loadMore()}
      class="rounded-full bg-coral-100 px-6 py-2 font-medium text-coral-700 transition-colors hover:bg-coral-200 active:scale-[0.98]"
    >
      {m.gallery_load_more({ remaining: String(remaining) })}
    </button>
  </div>
{/if}
