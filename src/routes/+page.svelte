<script lang="ts">
  import { enhance } from "$app/forms"
  import { gallery } from "$lib/stores/gallery.svelte"
  import PromptInput from "$lib/components/PromptInput.svelte"
  import ImageDisplay from "$lib/components/ImageDisplay.svelte"
  import Gallery from "$lib/components/Gallery.svelte"
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte"
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

<main
  class="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 px-4 py-8"
>
  <header class="mb-8 text-center">
    <h1 class="text-4xl font-bold text-purple-800 sm:text-5xl">
      Magic Coloring Pages!
    </h1>
    <p class="mt-2 text-lg text-purple-600">Tell us what you want to color!</p>
  </header>

  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Current Image Display -->
    <section class="rounded-3xl bg-white p-6 shadow-xl">
      {#if gallery.isGenerating}
        <LoadingSpinner />
      {:else if gallery.currentImage}
        <ImageDisplay
          imageData={gallery.currentImage.imageData}
          prompt={gallery.currentImage.prompt}
        />
      {:else}
        <div class="py-16 text-center">
          <div
            class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-purple-100"
          >
            <svg
              class="h-12 w-12 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p class="text-xl text-purple-400">
            Your coloring page will appear here!
          </p>
          <p class="mt-2 text-purple-300">
            Enter a prompt below to get started
          </p>
        </div>
      {/if}
    </section>

    <!-- Error Display -->
    {#if gallery.error}
      <div
        class="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-center"
      >
        <p class="font-medium text-red-600">{gallery.error}</p>
        <button
          onclick={() => gallery.clearError()}
          class="mt-2 text-sm text-red-500 underline"
        >
          Dismiss
        </button>
      </div>
    {/if}

    <!-- Prompt Input -->
    <section class="rounded-3xl bg-white p-6 shadow-xl">
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
        <PromptInput disabled={gallery.isGenerating} />
      </form>
    </section>

    <!-- Gallery -->
    {#if gallery.images.length > 0}
      <section class="rounded-3xl bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-2xl font-bold text-purple-800">
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

  <footer class="mt-12 text-center text-sm text-purple-400">
    <p>Powered by Google Gemini</p>
  </footer>
</main>
