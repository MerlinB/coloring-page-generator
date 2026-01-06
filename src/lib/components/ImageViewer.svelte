<!--
  @component Displays the current coloring page with download/print actions, or a placeholder when empty.

  @example
  <ImageViewer imageData={base64String} prompt="A friendly dragon" onexpand={() => openLightbox()} />
  <ImageViewer imageData={null} prompt={null} />
-->
<script lang="ts">
  import { Image, Download, Printer, Maximize2 } from "@lucide/svelte"

  interface Props {
    imageData: string | null
    prompt: string | null
    onexpand?: () => void
  }

  let { imageData, prompt, onexpand }: Props = $props()

  function downloadImage() {
    if (!imageData) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${imageData}`
    link.download = `coloring-page-${Date.now()}.png`
    link.click()
  }

  function printImage() {
    if (!imageData || !prompt) return
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Coloring Page - ${prompt}</title></head>
          <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
            <img src="data:image/png;base64,${imageData}" style="max-width: 100%; max-height: 100vh;" />
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }
</script>

{#if imageData && prompt}
  <div class="group relative overflow-hidden rounded-3xl bg-white shadow-lg">
    <!-- Clickable image -->
    {#if onexpand}
      <button
        type="button"
        onclick={() => onexpand()}
        class="block w-full cursor-zoom-in"
        aria-label="View full size"
      >
        <img
          src="data:image/png;base64,{imageData}"
          alt="Coloring page: {prompt}"
          class="h-auto w-full"
        />
      </button>
    {:else}
      <img
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

    <!-- Bottom bar with solid background -->
    <div
      class="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-white/95 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-center font-display text-base text-coral-700 sm:text-left">
        "{prompt}"
      </p>

      <div class="flex shrink-0 justify-center gap-3">
        <button
          type="button"
          onclick={() => downloadImage()}
          class="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-[0.98]"
        >
          <Download class="h-5 w-5" />
          Download
        </button>

        <button
          type="button"
          onclick={() => printImage()}
          class="flex items-center gap-2 rounded-full border-2 border-coral-200 bg-secondary px-5 py-2.5 font-bold text-secondary-foreground transition-transform hover:scale-105 active:scale-[0.98]"
        >
          <Printer class="h-5 w-5" />
          Print
        </button>
      </div>
    </div>
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
