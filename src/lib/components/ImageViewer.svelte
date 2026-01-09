<!--
  @component Displays the current coloring page with download/print actions, or a placeholder when empty.

  @example
  <ImageViewer imageData={base64String} prompt="A friendly dragon" onexpand={() => openLightbox()} />
  <ImageViewer imageData={null} prompt={null} />
-->
<script lang="ts">
  import { Image, Download, Printer, Pencil } from "@lucide/svelte"
  import { printImage as doPrint } from "$lib/utils/print"
  import * as m from "$lib/paraglide/messages"

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
          aria-label={m.viewer_view_full_size()}
        >
          <img
            bind:this={imageEl}
            src="data:image/png;base64,{imageData}"
            alt={m.viewer_alt_text({ prompt })}
            class="h-auto w-full"
          />
        </button>
      {:else}
        <img
          bind:this={imageEl}
          src="data:image/png;base64,{imageData}"
          alt={m.viewer_alt_text({ prompt })}
          class="h-auto w-full"
        />
      {/if}

      <!-- Action buttons (bottom right, floating individually) -->
      <div class="absolute right-3 bottom-3 flex gap-2">
        {#if onedit}
          <button
            type="button"
            title={m.viewer_edit()}
            onclick={() => onedit()}
            class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-lavender-200 bg-lavender-50 text-lavender-700 shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
          >
            <Pencil class="h-5 w-5" />
            <span class="hidden font-bold sm:inline">{m.viewer_edit()}</span>
          </button>
        {/if}

        <button
          type="button"
          title={m.viewer_download()}
          onclick={() => downloadImage()}
          class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
        >
          <Download class="h-5 w-5" />
          <span class="hidden font-bold sm:inline">{m.viewer_download()}</span>
        </button>

        <button
          type="button"
          title={m.viewer_print()}
          onclick={() => printImage()}
          class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-200 bg-secondary text-secondary-foreground shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-[0.98] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
        >
          <Printer class="h-5 w-5" />
          <span class="hidden font-bold sm:inline">{m.viewer_print()}</span>
        </button>
      </div>
    </div>

    <!-- Title below image -->
    <p
      class="mt-3 line-clamp-2 text-center font-display text-lg text-coral-700 sm:text-left"
    >
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
      {m.viewer_placeholder_title()}
    </p>
    <p class="mt-2 text-muted-foreground">
      {m.viewer_placeholder_hint()}
    </p>
  </div>
{/if}
