<!--
  @component Purchase success page - displays the redemption code after successful payment.
-->
<script lang="ts">
  import { browser } from "$app/environment"
  import { Check, Copy, ArrowLeft } from "@lucide/svelte"
  import { codesStore } from "$lib/stores/codes.svelte"
  import { usageStore } from "$lib/stores/usage.svelte"
  import type { PageData } from "./$types"
  import * as m from "$lib/paraglide/messages"

  let { data }: { data: PageData } = $props()

  let copied = $state(false)
  let codeSaved = $state(false)

  // Automatically save the code to browser storage when page loads
  $effect(() => {
    if (browser && data.code && data.status === "active" && !codeSaved) {
      codeSaved = true
      codesStore.addCode(data.code).then(() => {
        usageStore.fetchUsage()
      })
    }
  })

  async function copyCode() {
    if (!data.code) return
    await navigator.clipboard.writeText(data.code)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<svelte:head>
  <title>{m.success_page_title()}</title>
  <meta name="description" content={m.success_page_description()} />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-lg">
    <div
      class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/20"
    >
      <Check class="h-8 w-8 text-success" />
    </div>

    <h1 class="font-display text-3xl font-bold text-coral-700">
      {m.success_title()}
    </h1>

    <p class="mt-2 text-muted-foreground">
      {m.success_message()}
    </p>

    {#if data.code}
      <div class="mt-6 rounded-2xl bg-gold-50 p-4">
        <div class="font-mono text-2xl font-bold tracking-wider text-gold-800">
          {data.code}
        </div>
        <button
          type="button"
          onclick={() => copyCode()}
          class="mt-2 inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-800"
        >
          {#if copied}
            <Check class="h-4 w-4" />
            {m.success_copied()}
          {:else}
            <Copy class="h-4 w-4" />
            {m.success_copy_code()}
          {/if}
        </button>
      </div>

      <div class="mt-4 rounded-xl bg-lavender-50 px-4 py-3">
        <p class="text-sm font-medium text-lavender-700">
          {m.success_images_included({ tokens: String(data.tokens) })}
        </p>
      </div>

      <p class="mt-4 text-sm text-muted-foreground">
        {#if data.status === "pending"}
          {m.success_pending_message()}
        {:else}
          {m.success_active_message()}
        {/if}
      </p>
    {:else}
      <div class="mt-6 rounded-2xl bg-gold-50 p-4">
        <p class="text-gold-700">
          {m.success_no_code_message()}
        </p>
      </div>
    {/if}

    <a
      href="/"
      data-sveltekit-reload
      class="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
    >
      <ArrowLeft class="h-5 w-5" />
      {m.success_start_creating()}
    </a>
  </div>
</main>
