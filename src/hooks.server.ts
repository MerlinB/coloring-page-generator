import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import { AsyncLocalStorage } from "node:async_hooks"
import { paraglideMiddleware } from "$lib/paraglide/server"
import {
  overwriteGetLocale,
  baseLocale,
  isLocale,
} from "$lib/paraglide/runtime"
import { getLocaleFromHostname } from "$lib/i18n/domains"

/**
 * AsyncLocalStorage for request-scoped locale.
 * This prevents race conditions when handling concurrent requests with different locales.
 */
const localeStorage = new AsyncLocalStorage<string>()

/**
 * Override paraglide's getLocale to use our domain-based detection.
 * This is the recommended approach per paraglide documentation.
 */
overwriteGetLocale(() => {
  const stored = localeStorage.getStore()
  if (stored && isLocale(stored)) {
    return stored
  }
  return baseLocale
})

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
 * Uses AsyncLocalStorage to properly scope locale per request.
 */
const paraglideHandle: Handle = ({ event, resolve }) => {
  // Use x-forwarded-host (proxy) or host header for custom domains
  // Fall back to event.url.hostname for local development
  const hostname =
    event.request.headers.get("x-forwarded-host") ??
    event.request.headers.get("host") ??
    event.url.hostname
  const domainLocale = getLocaleFromHostname(hostname)

  console.log("[i18n] hostname:", hostname, "-> locale:", domainLocale)

  // Run request handling within the locale context
  // This ensures getLocale() returns the correct locale for this request
  return localeStorage.run(domainLocale, () => {
    return paraglideMiddleware(event.request, ({ request, locale }) => {
      console.log("[i18n] paraglide locale:", locale)
      event.request = request
      return resolve(event, {
        transformPageChunk: ({ html }) => html.replace("%lang%", locale),
      })
    })
  })
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
