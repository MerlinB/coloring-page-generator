<!--
  @component Full-screen lightbox for viewing public gallery images.
  Provides download, print, and "create similar" functionality.

  @example
  <PublicLightbox
    {image}
    onclose={() => lightboxImage = null}
  />
-->
<script lang="ts">
  import { X, Download, Printer, Sparkles } from "@lucide/svelte"
  import type { PublicGalleryImage } from "$lib/server/services/gallery"
  import { untrack } from "svelte"
  import { printImage as doPrint } from "$lib/utils/print"
  import * as m from "$lib/paraglide/messages"

  interface Props {
    image: PublicGalleryImage
    onclose: () => void
  }

  let { image, onclose }: Props = $props()

  // Element refs
  let backdropEl: HTMLDivElement | undefined = $state()
  let dialogEl: HTMLDivElement | undefined = $state()
  let imageEl: HTMLImageElement | undefined = $state()
  let previouslyFocused: Element | null = null

  // Keyboard handler
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onclose()
    }
  }

  // Click outside to close
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === backdropEl) {
      onclose()
    }
  }

  // Download image from blob URL
  async function downloadImage() {
    try {
      const response = await fetch(image.blobUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `coloring-page-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download image:", error)
    }
  }

  function printImage() {
    if (imageEl) doPrint(imageEl)
  }

  // Focus management and scroll lock
  $effect(() => {
    // Store previously focused element
    previouslyFocused = document.activeElement

    // Lock body scroll
    document.body.style.overflow = "hidden"

    // Focus the dialog
    untrack(() => {
      dialogEl?.focus()
    })

    return () => {
      // Restore body scroll
      document.body.style.overflow = ""

      // Restore focus
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  })
</script>

<svelte:window onkeydown={(e) => handleKeydown(e)} />

<div
  bind:this={backdropEl}
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
  onclick={(e) => handleBackdropClick(e)}
  role="presentation"
>
  <div
    bind:this={dialogEl}
    role="dialog"
    aria-modal="true"
    aria-label={m.lightbox_label()}
    tabindex="-1"
    class="relative flex h-full w-full max-w-5xl flex-col items-center justify-center outline-none"
  >
    <!-- Close button -->
    <button
      type="button"
      onclick={() => onclose()}
      aria-label={m.lightbox_close()}
      class="absolute top-0 right-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
    >
      <X class="h-6 w-6" />
    </button>

    <!-- Image container -->
    <div class="flex max-h-[75vh] flex-col items-center px-8 sm:px-16">
      <div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
        <img
          bind:this={imageEl}
          src={image.blobUrl}
          alt={m.viewer_alt_text({ prompt: image.prompt })}
          class="max-h-[70vh] w-auto object-contain"
          crossorigin="anonymous"
        />
      </div>

      <!-- Prompt caption -->
      <p class="mt-4 text-center font-display text-lg text-white/90">
        "{image.prompt}"
      </p>
    </div>

    <!-- Bottom bar -->
    <div
      class="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-3 px-4 pb-4 sm:px-8"
    >
      <!-- Create similar button -->
      <a
        href="/?prompt={encodeURIComponent(image.prompt)}"
        class="flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Sparkles class="h-5 w-5" />
        <span class="hidden sm:inline">{m.gallery_cta_create_similar()}</span>
      </a>

      <button
        type="button"
        onclick={() => downloadImage()}
        aria-label={m.viewer_download()}
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <Download class="h-5 w-5" />
      </button>

      <button
        type="button"
        onclick={() => printImage()}
        aria-label={m.viewer_print()}
        class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <Printer class="h-5 w-5" />
      </button>
    </div>
  </div>
</div>
