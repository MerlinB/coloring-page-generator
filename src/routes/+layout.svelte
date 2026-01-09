<script lang="ts">
  import { browser } from "$app/environment"
  import { page } from "$app/state"
  import { gallery } from "$lib/stores/gallery.svelte"
  import { fingerprintStore } from "$lib/stores/fingerprint.svelte"
  import { usageStore } from "$lib/stores/usage.svelte"
  import { locales, getLocale } from "$lib/paraglide/runtime"
  import { buildDomainUrl, type Locale } from "$lib/i18n/domains"
  import "$lib/i18n/client" // Initialize client-side locale detection
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte"
  import Footer from "$lib/components/Footer.svelte"
  import * as m from "$lib/paraglide/messages"
  import "./layout.css"
  import favicon from "$lib/assets/favicon.svg"

  const currentLocale = $derived(getLocale() as Locale)
  const canonicalUrl = $derived(
    buildDomainUrl(page.url.pathname, currentLocale),
  )
  const ogLocale = $derived(currentLocale === "de" ? "de_DE" : "en_US")

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
  <!-- Base SEO -->
  <title>{m.site_title()}</title>
  <meta name="description" content={m.site_description()} />
  <meta name="theme-color" content="#E86A50" />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href={favicon} />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={m.site_title()} />
  <meta property="og:title" content={m.site_title()} />
  <meta property="og:description" content={m.site_description()} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:locale" content={ogLocale} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={m.site_title()} />
  <meta name="twitter:description" content={m.site_description()} />

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

  <!-- JSON-LD Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: m.site_title(),
    description: m.site_description(),
    url: buildDomainUrl("/", currentLocale),
    applicationCategory: "DesignApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  })}</script>`}
</svelte:head>

<!-- Language Switcher (fixed position) -->
<div class="fixed top-4 right-4 z-40">
  <LanguageSwitcher />
</div>

{@render children()}

<Footer />
