import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import { AsyncLocalStorage } from "node:async_hooks"
import {
  overwriteGetLocale,
  baseLocale,
  isLocale,
} from "$lib/paraglide/runtime"
import { getLocaleFromHostname } from "$lib/i18n/domains"
import {
  generateServerFingerprint,
  getClientIp,
} from "$lib/server/services/fingerprint"

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
 * Request body size limits per endpoint (bytes).
 * /api/generate allows larger bodies for base64 image editing.
 * /api/webhooks is excluded (Stripe handles its own security via signatures).
 */
const BODY_SIZE_LIMITS: Record<string, number> = {
  "/api/generate": 6 * 1024 * 1024, // 6MB for image editing
  "/api/gallery/save": 6 * 1024 * 1024, // 6MB for gallery image uploads
  "/api/webhooks/stripe": 1 * 1024 * 1024, // 1MB for Stripe webhooks
  default: 512 * 1024, // 512KB for other endpoints
}

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

/**
 * Request body size limit check.
 * Rejects requests that exceed size limits before processing.
 */
const bodySizeHandle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname

  // Only check API POST requests
  if (path.startsWith("/api/") && event.request.method === "POST") {
    const contentLength = event.request.headers.get("content-length")
    if (contentLength) {
      const size = parseInt(contentLength, 10)
      const limit = BODY_SIZE_LIMITS[path] ?? BODY_SIZE_LIMITS.default

      if (size > limit) {
        return new Response(
          JSON.stringify({
            error: "Request body too large",
          }),
          {
            status: 413,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }
  }

  return resolve(event)
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

/**
 * Server-side fingerprint generation.
 * Generates a deterministic fingerprint from IP + User-Agent.
 * This ensures the same user gets the same ID across both domains.
 */
const fingerprintHandle: Handle = ({ event, resolve }) => {
  const ip = getClientIp(event.request, () => event.getClientAddress())
  const userAgent = event.request.headers.get("user-agent")
  event.locals.fingerprint = generateServerFingerprint(ip, userAgent)
  return resolve(event)
}

/**
 * Security headers for all responses.
 */
const securityHeadersHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  )
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src https://js.stripe.com; connect-src 'self' https://api.stripe.com",
  )

  return response
}

export const handle = sequence(
  localeHandle,
  bodySizeHandle,
  fingerprintHandle,
  rateLimitHandle,
  securityHeadersHandle,
)
