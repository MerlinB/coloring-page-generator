<script lang="ts">
  import type { GalleryImage } from "$lib/types"

  interface Props {
    images: GalleryImage[]
    onselect: (image: GalleryImage) => void
    ondelete: (id: string) => void
  }

  let { images, onselect, ondelete }: Props = $props()
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
  {#each images as image (image.id)}
    <div class="group relative">
      <button
        onclick={() => onselect(image)}
        class="block w-full overflow-hidden rounded-xl border-2 border-purple-200 bg-white shadow-md transition-all hover:border-purple-400 hover:shadow-lg"
      >
        <img
          src="data:image/png;base64,{image.imageData}"
          alt="Coloring page: {image.prompt}"
          class="aspect-square w-full object-cover"
        />
      </button>

      <button
        onclick={() => ondelete(image.id)}
        class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        title="Delete"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <p class="mt-1 truncate text-center text-xs text-purple-600">
        {image.prompt}
      </p>
    </div>
  {/each}
</div>
