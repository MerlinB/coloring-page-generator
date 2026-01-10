<!--
  @component SEO-optimized gallery landing page for a specific tag.
  Shows recent images and prominent CTAs to drive generation.

  @example
  <GalleryLandingPage
    tag="dinosaur"
    displayName="Dinosaur"
    {images}
    locale="en"
    suggestions={["Friendly dinosaur playing", "Baby dino hatching", "Dinosaur in jungle"]}
  />
-->
<script lang="ts">
  import { Sparkles, Palette, ArrowRight } from "@lucide/svelte"
  import PublicGalleryItem from "./PublicGalleryItem.svelte"
  import PublicLightbox from "./PublicLightbox.svelte"
  import * as m from "$lib/paraglide/messages"
  import type { PublicGalleryImage } from "$lib/server/services/gallery"
  import type { Locale } from "$lib/i18n/domains"

  interface Props {
    tag: string
    displayName: string
    images: PublicGalleryImage[]
    locale: Locale
    suggestions?: string[]
  }

  let { tag, displayName, images, locale, suggestions = [] }: Props = $props()

  // Lightbox state
  let lightboxImage: PublicGalleryImage | null = $state(null)

  // Use stored suggestions if available, otherwise fall back to templates
  const displaySuggestions = $derived(
    suggestions.length > 0
      ? suggestions
      : [
          m.gallery_suggestion_happy({ tag: displayName }),
          m.gallery_suggestion_cute({ tag: displayName }),
          m.gallery_suggestion_with_flowers({ tag: displayName }),
        ],
  )
</script>

<main class="min-h-screen bg-background">
  <!-- Hero Section -->
  <header class="relative overflow-hidden px-4 pt-12 pb-8 text-center sm:pt-16">
    <!-- Decorative background -->
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-b from-coral-50 to-transparent"
    ></div>

    <div class="mx-auto max-w-3xl">
      <h1
        class="font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
      >
        {m.gallery_tag_title({ tag: displayName })}
      </h1>
      <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
        {m.gallery_tag_description({ tag: displayName })}
      </p>

      <!-- Primary CTA -->
      <a
        href="/?prompt={encodeURIComponent(displayName)}"
        class="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-[0.98]"
      >
        <Sparkles class="h-5 w-5" />
        {m.gallery_cta_create({ tag: displayName })}
      </a>
    </div>
  </header>

  <div class="mx-auto max-w-5xl px-4 pb-16">
    <!-- Recent Images Section -->
    {#if images.length > 0}
      <section class="mb-12">
        <h2 class="mb-6 font-display text-xl font-bold text-coral-700 sm:text-2xl">
          {m.gallery_recent_images({ tag: displayName })}
        </h2>
        <div
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {#each images as image (image.id)}
            <PublicGalleryItem {image} onselect={(img) => (lightboxImage = img)} />
          {/each}
        </div>
      </section>
    {/if}

    <!-- Suggestions Section -->
    <section class="mb-12">
      <h2 class="mb-4 font-display text-xl font-bold text-foreground">
        {m.gallery_try_these()}
      </h2>
      <div class="flex flex-wrap gap-3">
        {#each displaySuggestions as suggestion}
          <a
            href="/?prompt={encodeURIComponent(suggestion)}"
            class="inline-flex items-center gap-2 rounded-full bg-lavender-50 px-4 py-2 text-sm font-medium text-lavender-700 transition-colors hover:bg-lavender-100"
          >
            {suggestion}
            <ArrowRight class="h-4 w-4" />
          </a>
        {/each}
      </div>
    </section>

    <!-- Secondary CTA Section -->
    <section
      class="rounded-3xl bg-gradient-to-br from-card to-coral-50 p-8 text-center shadow-lg sm:p-12"
    >
      <Palette class="mx-auto h-12 w-12 text-coral-500" />
      <h2 class="mt-4 font-display text-2xl font-bold text-foreground sm:text-3xl">
        {m.gallery_cta_section_title()}
      </h2>
      <p class="mx-auto mt-2 max-w-md text-muted-foreground">
        {m.gallery_cta_section_desc()}
      </p>
      <a
        href="/"
        class="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
      >
        {m.gallery_start_creating()}
        <ArrowRight class="h-4 w-4" />
      </a>
    </section>
  </div>
</main>

{#if lightboxImage}
  <PublicLightbox image={lightboxImage} onclose={() => (lightboxImage = null)} />
{/if}
