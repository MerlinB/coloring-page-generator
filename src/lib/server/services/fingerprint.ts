import { createHash } from "node:crypto"

/**
 * Generate a server-side fingerprint from request headers.
 * Uses IP + User-Agent for cross-domain consistency.
 *
 * This replaces client-side FingerprintJS to ensure the same user
 * gets the same fingerprint regardless of which domain they visit.
 */
export function generateServerFingerprint(
  ip: string,
  userAgent: string | null,
): string {
  const normalizedIp = normalizeIp(ip)
  const normalizedUa = userAgent?.trim() ?? "unknown"

  const hash = createHash("sha256")
  hash.update(`${normalizedIp}:${normalizedUa}`)

  // Return first 32 chars (128 bits) prefixed with "srv_" for identification
  return `srv_${hash.digest("hex").slice(0, 32)}`
}

/**
 * Extract client IP from request, handling proxies.
 */
export function getClientIp(
  request: Request,
  getClientAddress: () => string,
): string {
  // Check x-forwarded-for first (from reverse proxies like Cloudflare, Vercel)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // First IP in the chain is the original client
    return forwarded.split(",")[0].trim()
  }

  // Check x-real-ip (nginx style)
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  // Fall back to SvelteKit's getClientAddress
  return getClientAddress()
}

/**
 * Normalize IP address for consistent hashing.
 * Handles IPv6 localhost variations.
 */
function normalizeIp(ip: string): string {
  // Treat IPv6 localhost as IPv4 localhost
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1"
  }
  return ip.trim()
}
