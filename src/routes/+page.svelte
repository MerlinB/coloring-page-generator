<script lang="ts">
  import { enhance } from "$app/forms"
  import { gallery } from "$lib/stores/gallery.svelte"
  import PromptForm from "$lib/components/PromptForm.svelte"
  import ImageViewer from "$lib/components/ImageViewer.svelte"
  import Gallery from "$lib/components/Gallery.svelte"
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte"
  import ErrorMessage from "$lib/components/ErrorMessage.svelte"
  import Lightbox from "$lib/components/Lightbox.svelte"
  import type { ActionData } from "./$types"

  // Lightbox state
  let lightboxOpen = $state(false)
  let lightboxIndex = $state(0)

  function openLightbox(index: number) {
    lightboxIndex = index
    lightboxOpen = true
  }

  function openLightboxForCurrentImage() {
    if (!gallery.currentImage) return
    const index = gallery.images.findIndex(
      (img) => img.id === gallery.currentImage?.id
    )
    if (index >= 0) {
      openLightbox(index)
    }
  }

  function closeLightbox() {
    lightboxOpen = false
  }

  function navigateLightbox(index: number) {
    if (index >= 0 && index < gallery.images.length) {
      lightboxIndex = index
    }
  }

</script>

<svelte:head>
  <title>Coloring Pages Generator</title>
  <meta
    name="description"
    content="Create fun coloring pages for children with AI"
  />
</svelte:head>

<main class="min-h-screen bg-background px-4 py-8">
  <header class="mx-auto mb-8 max-w-7xl text-center lg:text-left">
    <h1 class="font-display text-4xl font-bold text-coral-700 sm:text-5xl">
      Magic Coloring Pages!
    </h1>
    <p class="mt-2 text-lg text-muted-foreground">
      Tell us what you want to color!
    </p>
  </header>

  <!-- Split Panel Layout: Form (left) + Image (right) on desktop -->
  <div
    class="mx-auto max-w-2xl space-y-6 lg:max-w-7xl lg:grid lg:grid-cols-[400px_1fr] lg:gap-8 lg:space-y-0 xl:grid-cols-[420px_1fr]"
  >
    <!-- Left Panel: Form + Error -->
    <div class="order-2 space-y-6 lg:order-1 lg:sticky lg:top-8 lg:self-start">
      <!-- Error Display -->
      {#if gallery.error}
        <ErrorMessage
          message={gallery.error}
          ondismiss={() => gallery.clearError()}
        />
      {/if}

      <!-- Prompt Input -->
      <section class="rounded-3xl bg-card p-6 shadow-lg">
        <form
          method="POST"
          use:enhance={() => {
            gallery.setGenerating(true)
            gallery.clearError()

            return async ({ result, update }) => {
              if (result.type === "success") {
                const data = result.data as ActionData
                if (data?.success && data.image) {
                  gallery.addImage({
                    ...data.image,
                    createdAt: new Date(data.image.createdAt),
                  })
                } else if (data?.error) {
                  gallery.setError(data.error)
                }
              } else if (result.type === "failure") {
                const data = result.data as ActionData
                gallery.setError(data?.error ?? "Generation failed")
              } else if (result.type === "error") {
                gallery.setError("An unexpected error occurred")
              }
              gallery.setGenerating(false)
              await update({ reset: false })
            }
          }}
        >
          <PromptForm disabled={gallery.isGenerating} />
        </form>
      </section>
    </div>

    <!-- Right Panel: Image Viewer -->
    <div class="order-1 lg:order-2">
      {#if gallery.isGenerating}
        <div
          class="flex min-h-[400px] items-center justify-center rounded-3xl bg-card shadow-lg lg:min-h-[500px]"
        >
          <LoadingSpinner />
        </div>
      {:else}
        <ImageViewer
          imageData={gallery.currentImage?.imageData ?? null}
          prompt={gallery.currentImage?.prompt ?? null}
          onexpand={() => openLightboxForCurrentImage()}
        />
      {/if}
    </div>
  </div>

  <!-- Gallery (full width below split panel) -->
  {#if gallery.images.length > 0}
    <section class="mx-auto mt-8 max-w-7xl rounded-3xl bg-card p-6 shadow-lg">
      <h2 class="mb-4 font-display text-2xl font-bold text-coral-700">
        Your Coloring Pages
      </h2>
      <Gallery
        images={gallery.images}
        onselect={(image) => gallery.setCurrentImage(image)}
        onlightbox={(index) => openLightbox(index)}
        ondelete={(id) => gallery.removeImage(id)}
      />
    </section>
  {/if}

  <footer class="mt-12 text-center text-sm text-muted-foreground">
    <p>Powered by Google Gemini</p>
  </footer>
</main>

<!-- Lightbox overlay -->
{#if lightboxOpen && gallery.images.length > 0}
  <Lightbox
    images={gallery.images}
    currentIndex={lightboxIndex}
    onclose={() => closeLightbox()}
    onnavigate={(index) => navigateLightbox(index)}
    ondelete={(id) => gallery.removeImage(id)}
  />
{/if}
