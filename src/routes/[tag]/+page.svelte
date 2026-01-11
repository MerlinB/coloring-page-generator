<script lang="ts">
  import GalleryLandingPage from "$lib/components/GalleryLandingPage.svelte"
  import * as m from "$lib/paraglide/messages"
  import { buildDomainUrl } from "$lib/i18n/domains"

  let { data } = $props()
</script>

<svelte:head>
  <title
    >{m.gallery_tag_title({ tag: data.displayName })} | {m.site_title()}</title
  >
  <meta
    name="description"
    content={m.gallery_tag_description({ tag: data.displayName })}
  />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="{m.gallery_tag_title({
      tag: data.displayName,
    })} | {m.site_title()}"
  />
  <meta
    property="og:description"
    content={m.gallery_tag_description({ tag: data.displayName })}
  />
  <meta property="og:type" content="website" />

  <!-- Canonical URL -->
  <link
    rel="canonical"
    href={buildDomainUrl(`/${data.urlSlug}`, data.locale)}
  />

  <!-- hreflang tags - override layout defaults with correct localized slugs -->
  {#each Object.entries(data.alternateUrls) as [lang, url]}
    <link rel="alternate" hreflang={lang} href={url} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={data.alternateUrls.en} />

  <!-- JSON-LD Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: m.gallery_tag_title({ tag: data.displayName }),
    description: m.gallery_tag_description({ tag: data.displayName }),
    url: buildDomainUrl(`/${data.urlSlug}`, data.locale),
    mainEntity: {
      "@type": "ImageGallery",
      name: m.gallery_recent_images({ tag: data.displayName }),
      numberOfItems: data.images.length,
    },
  })}</script>`}
</svelte:head>

<GalleryLandingPage
  tag={data.tag}
  displayName={data.displayName}
  images={data.images}
  locale={data.locale}
  suggestions={data.suggestions}
/>
