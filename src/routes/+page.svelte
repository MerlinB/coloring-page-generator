<script lang="ts">
  import { enhance } from "$app/forms"
  import { gallery } from "$lib/stores/gallery.svelte"
  import PromptForm from "$lib/components/PromptForm.svelte"
  import ImageViewer from "$lib/components/ImageViewer.svelte"
  import Gallery from "$lib/components/Gallery.svelte"
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte"
  import ErrorMessage from "$lib/components/ErrorMessage.svelte"
  import type { ActionData } from "./$types"

  interface Props {
    form: ActionData
  }

  let { form }: Props = $props()

  $effect(() => {
    if (form?.success && form.image) {
      gallery.addImage({
        ...form.image,
        createdAt: new Date(form.image.createdAt),
      })
      gallery.setGenerating(false)
    } else if (form?.error) {
      gallery.setError(form.error)
      gallery.setGenerating(false)
    }
  })
</script>

<svelte:head>
  <title>Coloring Pages Generator</title>
  <meta
    name="description"
    content="Create fun coloring pages for children with AI"
  />
</svelte:head>

<main class="min-h-screen bg-background px-4 py-8">
  <header class="mb-8 text-center">
    <h1 class="font-display text-4xl font-bold text-coral-700 sm:text-5xl">
      Magic Coloring Pages!
    </h1>
    <p class="mt-2 text-lg text-muted-foreground">
      Tell us what you want to color!
    </p>
  </header>

  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Current Image Display -->
    <section class="rounded-3xl bg-card p-6 shadow-lg">
      {#if gallery.isGenerating}
        <LoadingSpinner />
      {:else}
        <ImageViewer
          imageData={gallery.currentImage?.imageData ?? null}
          prompt={gallery.currentImage?.prompt ?? null}
        />
      {/if}
    </section>

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

          return async ({ update }) => {
            await update()
          }
        }}
      >
        <PromptForm disabled={gallery.isGenerating} />
      </form>
    </section>

    <!-- Gallery -->
    {#if gallery.images.length > 0}
      <section class="rounded-3xl bg-card p-6 shadow-lg">
        <h2 class="mb-4 font-display text-2xl font-bold text-coral-700">
          Your Coloring Pages
        </h2>
        <Gallery
          images={gallery.images}
          onselect={(image) => gallery.setCurrentImage(image)}
          ondelete={(id) => gallery.removeImage(id)}
        />
      </section>
    {/if}
  </div>

  <footer class="mt-12 text-center text-sm text-muted-foreground">
    <p>Powered by Google Gemini</p>
  </footer>
</main>
