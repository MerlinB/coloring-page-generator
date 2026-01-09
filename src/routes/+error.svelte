<!--
  @component Custom error page with SEO-appropriate meta tags.
  Displays friendly error messages for 404 and other errors.
-->
<script lang="ts">
  import { page } from "$app/state"
  import { Frown, Home, TriangleAlert } from "@lucide/svelte"
  import * as m from "$lib/paraglide/messages"

  const is404 = $derived(page.status === 404)
</script>

<svelte:head>
  <title>{is404 ? m.error_404_title() : m.error_generic_title()}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-lg">
    <div
      class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
      class:bg-lavender-100={is404}
      class:bg-coral-100={!is404}
    >
      {#if is404}
        <Frown class="h-10 w-10 text-lavender-600" />
      {:else}
        <TriangleAlert class="h-10 w-10 text-coral-600" />
      {/if}
    </div>

    <h1 class="font-display text-4xl font-bold text-foreground">
      {page.status}
    </h1>

    <p class="mt-2 text-lg text-muted-foreground">
      {#if is404}
        {m.error_404_message()}
      {:else}
        {m.error_generic_message()}
      {/if}
    </p>

    <a
      href="/"
      class="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      <Home class="h-5 w-5" />
      {m.error_back_home()}
    </a>
  </div>
</main>
