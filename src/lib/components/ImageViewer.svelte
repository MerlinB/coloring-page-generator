<!--
  @component Displays the current coloring page with download/print actions, or a placeholder when empty.

  @example
  <ImageViewer imageData={base64String} prompt="A friendly dragon" onexpand={() => openLightbox()} />
  <ImageViewer imageData={null} prompt={null} />
-->
<script lang="ts">
  import { Image, Download, Printer, Maximize2, Pencil } from "@lucide/svelte"
  import { printImage as doPrint } from "$lib/utils/print"

  interface Props {
    imageData: string | null
    prompt: string | null
    onexpand?: () => void
    onedit?: () => void
  }

  let { imageData, prompt, onexpand, onedit }: Props = $props()

  let imageEl: HTMLImageElement | undefined = $state()

  function downloadImage() {
    if (!imageData) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${imageData}`
    link.download = `coloring-page-${Date.now()}.png`
    link.click()
  }

  function printImage() {
    if (imageEl) doPrint(imageEl)
  }
</script>

{#if imageData && prompt}
  <div class="overflow-hidden rounded-3xl bg-white p-3 shadow-lg">
    <!-- Image container with floating buttons -->
    <div class="group relative overflow-hidden rounded-2xl">
      <!-- Clickable image -->
      {#if onexpand}
        <button
          type="button"
          onclick={() => onexpand()}
          class="block w-full cursor-zoom-in"
          aria-label="View full size"
        >
          <img
            bind:this={imageEl}
            src="data:image/png;base64,{imageData}"
            alt="Coloring page: {prompt}"
            class="h-auto w-full"
          />
        </button>
      {:else}
        <img
          bind:this={imageEl}
          src="data:image/png;base64,{imageData}"
          alt="Coloring page: {prompt}"
          class="h-auto w-full"
        />
      {/if}

      <!-- Expand hint (top right) -->
      {#if onexpand}
        <div
          class="pointer-events-none absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-coral-600 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        >
          <Maximize2 class="h-5 w-5" />
        </div>
      {/if}

      <!-- Action buttons (bottom right, floating individually) -->
      <div class="absolute bottom-3 right-3 flex gap-2">
        {#if onedit}
          <button
            type="button"
            title="Edit"
            onclick={() => onedit()}
            class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-lavender-200 bg-lavender-50 text-lavender-700 shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
          >
            <Pencil class="h-5 w-5" />
            <span class="hidden font-bold sm:inline">Edit</span>
          </button>
        {/if}

        <button
          type="button"
          title="Download"
          onclick={() => downloadImage()}
          class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
        >
          <Download class="h-5 w-5" />
          <span class="hidden font-bold sm:inline">Download</span>
        </button>

        <button
          type="button"
          title="Print"
          onclick={() => printImage()}
          class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-200 bg-secondary text-secondary-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:py-2 sm:px-4"
        >
          <Printer class="h-5 w-5" />
          <span class="hidden font-bold sm:inline">Print</span>
        </button>
      </div>
    </div>

    <!-- Title below image -->
    <p class="mt-3 line-clamp-2 text-center font-display text-lg text-coral-700 sm:text-left">
      "{prompt}"
    </p>
  </div>
{:else}
  <div
    class="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-card p-8 shadow-lg lg:min-h-[500px]"
  >
    <div
      class="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-coral-50"
    >
      <Image class="h-12 w-12 text-coral-300" />
    </div>
    <p class="font-display text-xl text-coral-400">
      Your coloring page will appear here!
    </p>
    <p class="mt-2 text-muted-foreground">
      Enter a prompt below to get started
    </p>
  </div>
{/if}
