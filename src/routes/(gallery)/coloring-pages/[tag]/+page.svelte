<script lang="ts">
  import GalleryLandingPage from "$lib/components/GalleryLandingPage.svelte"
  import * as m from "$lib/paraglide/messages"
  import { buildDomainUrl, type Locale } from "$lib/i18n/domains"
  import { locales } from "$lib/paraglide/runtime"
  import { getLocalizedSlug } from "$lib/server/services/tagTranslation"
  import { GALLERY_PREFIXES } from "$lib/i18n/galleryRoutes"

  let { data } = $props()
</script>

<svelte:head>
  <title>{m.gallery_tag_title({ tag: data.displayName })} | {m.site_title()}</title>
  <meta
    name="description"
    content={m.gallery_tag_description({ tag: data.displayName })}
  />

  <!-- Open Graph -->
  <meta
    property="og:title"
    content="{m.gallery_tag_title({ tag: data.displayName })} | {m.site_title()}"
  />
  <meta
    property="og:description"
    content={m.gallery_tag_description({ tag: data.displayName })}
  />
  <meta property="og:type" content="website" />

  <!-- Canonical URL -->
  <link
    rel="canonical"
    href={buildDomainUrl(`/coloring-pages/${data.urlSlug}`, "en")}
  />

  <!-- JSON-LD Structured Data -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: m.gallery_tag_title({ tag: data.displayName }),
    description: m.gallery_tag_description({ tag: data.displayName }),
    url: buildDomainUrl(`/coloring-pages/${data.urlSlug}`, "en"),
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
/>
