import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import { AsyncLocalStorage } from "node:async_hooks"
import {
  overwriteGetLocale,
  baseLocale,
  isLocale,
} from "$lib/paraglide/runtime"
import { getLocaleFromHostname } from "$lib/i18n/domains"

/**
 * AsyncLocalStorage for request-scoped locale.
 * Prevents race conditions when handling concurrent requests with different locales.
 */
const localeStorage = new AsyncLocalStorage<string>()

/**
 * Override paraglide's getLocale to use our domain-based detection.
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
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/generate": { max: 20, windowMs: 60000 },
  "/api/checkout": { max: 10, windowMs: 60000 },
  "/api/redeem": { max: 10, windowMs: 60000 },
}

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
 * Domain-based locale detection.
 * We don't use paraglideMiddleware because it has its own detection logic.
 * Instead, we use overwriteGetLocale + AsyncLocalStorage directly.
 */
const localeHandle: Handle = ({ event, resolve }) => {
  const hostname =
    event.request.headers.get("x-forwarded-host") ??
    event.request.headers.get("host") ??
    event.url.hostname
  const locale = getLocaleFromHostname(hostname)

  // Run request in locale context so getLocale() returns correct value
  return localeStorage.run(locale, () => {
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace("%lang%", locale),
    })
  })
}

const rateLimitHandle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname
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
    cleanupOldEntries()
  }

  return resolve(event)
}

export const handle = sequence(localeHandle, rateLimitHandle)
