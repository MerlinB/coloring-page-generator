<script lang="ts">
  import { browser } from "$app/environment"
  import { page } from "$app/state"
  import { gallery } from "$lib/stores/gallery.svelte"
  import { fingerprintStore } from "$lib/stores/fingerprint.svelte"
  import { usageStore } from "$lib/stores/usage.svelte"
  import { locales } from "$lib/paraglide/runtime"
  import { buildDomainUrl, type Locale } from "$lib/i18n/domains"
  import "$lib/i18n/client" // Initialize client-side locale detection
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte"
  import "./layout.css"
  import favicon from "$lib/assets/favicon.svg"

  let { children, data } = $props()

  $effect(() => {
    if (browser) {
      gallery.initialize()
      // Initialize with server-provided fingerprint
      fingerprintStore.initialize(data.fingerprint)
    }
  })

  // Fetch usage once fingerprint is ready
  $effect(() => {
    if (browser && fingerprintStore.fingerprint && !fingerprintStore.loading) {
      usageStore.fetchUsage()
    }
  })
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <!-- hreflang tags for SEO - using domain URLs -->
  {#each locales as loc (loc)}
    <link
      rel="alternate"
      hreflang={loc}
      href={buildDomainUrl(page.url.pathname, loc as Locale)}
    />
  {/each}
  <!-- x-default points to the English domain -->
  <link
    rel="alternate"
    hreflang="x-default"
    href={buildDomainUrl(page.url.pathname, "en")}
  />
</svelte:head>

<!-- Language Switcher (fixed position) -->
<div class="fixed top-4 right-4 z-40">
  <LanguageSwitcher />
</div>

{@render children()}
