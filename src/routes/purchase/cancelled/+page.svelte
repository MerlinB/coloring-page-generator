<!--
  @component Purchase cancelled page - shown when user cancels checkout.
-->
<script lang="ts">
  import { XCircle, ArrowLeft } from "@lucide/svelte"
  import * as m from "$lib/paraglide/messages"
</script>

<svelte:head>
  <title>{m.cancelled_page_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-lg">
    <div
      class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
    >
      <XCircle class="h-8 w-8 text-muted-foreground" />
    </div>

    <h1 class="font-display text-3xl font-bold text-foreground">
      {m.cancelled_title()}
    </h1>

    <p class="mt-2 text-muted-foreground">
      {m.cancelled_message()}
    </p>

    <div class="mt-6 rounded-2xl bg-lavender-50 p-4">
      <p class="text-sm text-lavender-700">
        {m.cancelled_info()}
      </p>
    </div>

    <a
      href="/"
      data-sveltekit-reload
      class="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      <ArrowLeft class="h-5 w-5" />
      {m.cancelled_back()}
    </a>
  </div>
</main>
