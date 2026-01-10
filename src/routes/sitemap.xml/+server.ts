import type { RequestHandler } from "./$types"
import {
  getLocaleFromHostname,
  getDomainForLocale,
} from "$lib/i18n/domains"
import { getAllPublicTags } from "$lib/server/services/gallery"
import { getLocalizedSlug } from "$lib/server/services/tagTranslation"

/** Public pages to include in the sitemap (excludes transactional and API routes) */
const PAGES = ["/"]

export const GET: RequestHandler = async ({ request }) => {
  const hostname =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "makecoloringpages.com"

  const locale = getLocaleFromHostname(hostname)
  const domain = getDomainForLocale(locale)

  // Static pages
  const staticUrls = PAGES.map((path) => {
    return `  <url>
    <loc>${domain}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  })

  // Dynamic gallery tag pages (now at root level)
  const publicTags = await getAllPublicTags()
  const tagUrls = await Promise.all(
    publicTags.map(async (canonicalTag) => {
      const localizedSlug = await getLocalizedSlug(canonicalTag, locale)
      if (!localizedSlug) return null

      return `  <url>
    <loc>${domain}/${localizedSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
    }),
  )

  const allUrls = [...staticUrls, ...tagUrls.filter(Boolean)].join("\n")

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
