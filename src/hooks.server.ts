import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import { paraglideMiddleware } from "$lib/paraglide/server"
import { getLocaleFromHostname } from "$lib/i18n/domains"

/**
 * Simple in-memory rate limiting.
 * Note: This resets on server restart. For production with multiple instances,
 * consider using Redis or a distributed cache.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/generate": { max: 20, windowMs: 60000 }, // 20 per minute
  "/api/checkout": { max: 10, windowMs: 60000 }, // 10 per minute
  "/api/redeem": { max: 10, windowMs: 60000 }, // 10 per minute
}

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupOldEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Domain-based locale detection with paraglide middleware.
 * Detects locale from hostname and modifies request URL to include locale prefix
 * so paraglide correctly identifies the locale.
 */
const paraglideHandle: Handle = ({ event, resolve }) => {
  // Use x-forwarded-host (proxy) or host header for custom domains
  // Fall back to event.url.hostname for local development
  const hostname =
    event.request.headers.get("x-forwarded-host") ??
    event.request.headers.get("host") ??
    event.url.hostname
  const domainLocale = getLocaleFromHostname(hostname)

  // Debug logging (check Vercel function logs)
  console.log("[i18n] hostname:", hostname, "-> locale:", domainLocale)

  // Create a modified request with locale prefix for non-base locales
  // This allows paraglide to correctly detect the locale from the URL
  let requestForParaglide = event.request

  if (domainLocale !== "en") {
    const url = new URL(event.request.url)
    console.log("[i18n] original pathname:", url.pathname)
    // Only add prefix if not already present
    if (
      !url.pathname.startsWith(`/${domainLocale}/`) &&
      url.pathname !== `/${domainLocale}`
    ) {
      url.pathname = `/${domainLocale}${url.pathname}`
      console.log("[i18n] modified pathname:", url.pathname)
      requestForParaglide = new Request(url.toString(), event.request)
    }
  }

  return paraglideMiddleware(
    requestForParaglide,
    ({ request: localizedRequest, locale }) => {
      console.log("[i18n] paraglide detected locale:", locale)
      // Keep the original request URL (without locale prefix) for SvelteKit routing
      // The reroute hook in hooks.ts handles stripping the prefix
      event.request = localizedRequest
      return resolve(event, {
        transformPageChunk: ({ html }) => html.replace("%lang%", locale),
      })
    },
  )
}

const rateLimitHandle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname

  // Find matching rate limit rule
  const limitEntry = Object.entries(RATE_LIMITS).find(([prefix]) =>
    path.startsWith(prefix),
  )

  if (limitEntry) {
    const [, limit] = limitEntry
    const ip = event.getClientAddress()
    const key = `${ip}:${path}`
    const now = Date.now()

    let entry = rateLimitMap.get(key)

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + limit.windowMs }
      rateLimitMap.set(key, entry)
    }

    entry.count++

    if (entry.count > limit.max) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please slow down.",
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((entry.resetAt - now) / 1000).toString(),
          },
        },
      )
    }

    // Periodic cleanup
    cleanupOldEntries()
  }

  return resolve(event)
}

export const handle = sequence(paraglideHandle, rateLimitHandle)
