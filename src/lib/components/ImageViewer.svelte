<!--
  @component Displays the current coloring page with download/print actions, or a placeholder when empty.

  @example
  <ImageViewer imageData={base64String} prompt="A friendly dragon" />
  <ImageViewer imageData={null} prompt={null} />
-->
<script lang="ts">
  import { Image, Download, Printer } from "@lucide/svelte"

  interface Props {
    imageData: string | null
    prompt: string | null
  }

  let { imageData, prompt }: Props = $props()

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
  <div class="flex flex-col items-center">
    <div
      class="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-coral-100 bg-white shadow-lg"
    >
      <img
        src="data:image/png;base64,{imageData}"
        alt="Coloring page: {prompt}"
        class="h-auto w-full"
      />
    </div>

    <p class="mt-4 text-center font-display text-lg text-coral-600">
      "{prompt}"
    </p>

    <div class="mt-4 flex gap-4">
      <button
        type="button"
        onclick={() => downloadImage()}
        class="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-[0.98]"
      >
        <Download class="h-5 w-5" />
        Download
      </button>

      <button
        type="button"
        onclick={() => printImage()}
        class="flex items-center gap-2 rounded-full border-2 border-coral-200 bg-secondary px-6 py-3 font-bold text-secondary-foreground transition-transform hover:scale-105 active:scale-[0.98]"
      >
        <Printer class="h-5 w-5" />
        Print
      </button>
    </div>
  </div>
{:else}
  <div class="py-16 text-center">
    <div
      class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-coral-50"
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
