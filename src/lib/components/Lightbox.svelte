<!--
  @component Full-screen lightbox for viewing and navigating gallery images.

  @example
  <Lightbox
    images={gallery.images}
    currentIndex={0}
    onclose={() => closeLightbox()}
    onnavigate={(index) => setIndex(index)}
    ondelete={(id) => gallery.removeImage(id)}
  />
-->
<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    X,
    Download,
    Printer,
    Trash2,
    Pencil,
  } from "@lucide/svelte"
  import type { GalleryImage } from "$lib/types"
  import { untrack } from "svelte"
  import { printImage as doPrint } from "$lib/utils/print"

  interface Props {
    images: GalleryImage[]
    currentIndex: number
    onclose: () => void
    onnavigate: (index: number) => void
    ondelete: (id: string) => void
    onedit?: (image: GalleryImage) => void
  }

  let { images, currentIndex, onclose, onnavigate, ondelete, onedit }: Props =
    $props()

  // Touch swipe state
  let touchStartX = $state(0)
  let touchEndX = $state(0)
  const SWIPE_THRESHOLD = 50

  // Element refs
  let backdropEl: HTMLDivElement | undefined = $state()
  let dialogEl: HTMLDivElement | undefined = $state()
  let imageEl: HTMLImageElement | undefined = $state()
  let previouslyFocused: Element | null = null

  // Derived values
  let currentImage = $derived(images[currentIndex])
  let hasPrev = $derived(currentIndex > 0)
  let hasNext = $derived(currentIndex < images.length - 1)
  let positionText = $derived(`${currentIndex + 1} of ${images.length}`)

  // Navigation
  function navigatePrev() {
    if (hasPrev) {
      onnavigate(currentIndex - 1)
    }
  }

  function navigateNext() {
    if (hasNext) {
      onnavigate(currentIndex + 1)
    }
  }

  // Keyboard handler
  function handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case "Escape":
        onclose()
        break
      case "ArrowLeft":
        navigatePrev()
        break
      case "ArrowRight":
        navigateNext()
        break
    }
  }

  // Touch handlers
  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX
  }

  function handleTouchMove(event: TouchEvent) {
    touchEndX = event.touches[0].clientX
  }

  function handleTouchEnd() {
    const diff = touchStartX - touchEndX

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swiped left -> next
        navigateNext()
      } else {
        // Swiped right -> prev
        navigatePrev()
      }
    }

    touchStartX = 0
    touchEndX = 0
  }

  // Click outside to close
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === backdropEl) {
      onclose()
    }
  }

  // Image actions
  function downloadImage() {
    if (!currentImage) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${currentImage.imageData}`
    link.download = `coloring-page-${Date.now()}.png`
    link.click()
  }

  function printImage() {
    if (imageEl) doPrint(imageEl)
  }

  function deleteImage() {
    if (!currentImage) return
    const idToDelete = currentImage.id

    // If deleting the last image, close the lightbox
    if (images.length === 1) {
      onclose()
      ondelete(idToDelete)
      return
    }

    // If deleting the last item in the list, go to previous
    if (currentIndex === images.length - 1) {
      onnavigate(currentIndex - 1)
    }
    // Otherwise, stay at same index (next image will slide in)

    ondelete(idToDelete)
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
    aria-label="Image viewer"
    tabindex="-1"
    class="relative flex h-full w-full max-w-5xl flex-col items-center justify-center outline-none"
    ontouchstart={(e) => handleTouchStart(e)}
    ontouchmove={(e) => handleTouchMove(e)}
    ontouchend={() => handleTouchEnd()}
  >
    <!-- Close button -->
    <button
      type="button"
      onclick={() => onclose()}
      aria-label="Close"
      class="absolute top-0 right-0 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
    >
      <X class="h-6 w-6" />
    </button>

    <!-- Navigation: Previous -->
    {#if hasPrev}
      <button
        type="button"
        onclick={() => navigatePrev()}
        aria-label="Previous image"
        class="absolute top-1/2 left-0 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
      >
        <ChevronLeft class="h-8 w-8" />
      </button>
    {/if}

    <!-- Navigation: Next -->
    {#if hasNext}
      <button
        type="button"
        onclick={() => navigateNext()}
        aria-label="Next image"
        class="absolute top-1/2 right-0 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
      >
        <ChevronRight class="h-8 w-8" />
      </button>
    {/if}

    <!-- Image container -->
    {#if currentImage}
      <div class="flex max-h-[75vh] flex-col items-center px-16 sm:px-20">
        <div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <img
            bind:this={imageEl}
            src="data:image/png;base64,{currentImage.imageData}"
            alt="Coloring page: {currentImage.prompt}"
            class="max-h-[70vh] w-auto object-contain"
          />
        </div>

        <!-- Prompt caption -->
        <p class="mt-4 text-center font-display text-lg text-white/90">
          "{currentImage.prompt}"
        </p>
      </div>
    {/if}

    <!-- Bottom bar -->
    <div
      class="absolute right-0 bottom-0 left-0 flex items-center justify-between px-4 pb-4 sm:px-8"
    >
      <!-- Position indicator -->
      <span class="text-sm text-white/70" aria-live="polite">
        {positionText}
      </span>

      <!-- Action buttons -->
      <div class="flex gap-3">
        {#if onedit && currentImage}
          <button
            type="button"
            onclick={() => onedit(currentImage)}
            aria-label="Edit"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-lavender-500/80 text-white transition-colors hover:bg-lavender-500"
          >
            <Pencil class="h-5 w-5" />
          </button>
        {/if}

        <button
          type="button"
          onclick={() => downloadImage()}
          aria-label="Download"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Download class="h-5 w-5" />
        </button>

        <button
          type="button"
          onclick={() => printImage()}
          aria-label="Print"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <Printer class="h-5 w-5" />
        </button>

        <button
          type="button"
          onclick={() => deleteImage()}
          aria-label="Delete"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/80 text-white transition-colors hover:bg-destructive"
        >
          <Trash2 class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</div>
