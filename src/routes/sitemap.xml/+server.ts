import type { RequestHandler } from "./$types"
import { getLocaleFromHostname, getDomainForLocale } from "$lib/i18n/domains"

/** Public pages to include in the sitemap (excludes transactional and API routes) */
const PAGES = ["/"]

export const GET: RequestHandler = ({ request }) => {
  const hostname =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "makecoloringpages.com"

  const locale = getLocaleFromHostname(hostname)
  const domain = getDomainForLocale(locale)

  const urls = PAGES.map((path) => {
    return `  <url>
    <loc>${domain}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  }).join("\n")

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
