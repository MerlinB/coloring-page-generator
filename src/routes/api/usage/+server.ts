import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import {
  getUsageWithCodes,
  getFreeUsageForDevice,
} from "$lib/server/services/usage"

/**
 * POST /api/usage
 * Get usage data for client-provided codes + fingerprint for free tier.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const fingerprint = locals.fingerprint

  try {
    const body = await request.json()
    const codes: string[] = Array.isArray(body.codes) ? body.codes : []

    const usage = await getUsageWithCodes(fingerprint, codes)
    return json(usage)
  } catch (error) {
    console.error("Usage fetch error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/usage
 * Backwards-compatible endpoint that only returns free tier usage.
 */
export const GET: RequestHandler = async ({ locals }) => {
  const fingerprint = locals.fingerprint

  try {
    const freeUsage = await getFreeUsageForDevice(fingerprint)
    return json({
      freeRemaining: freeUsage.freeRemaining,
      tokenBalance: 0,
      weekResetDate: freeUsage.weekResetDate,
      activeCode: null,
      activeCodes: [],
    })
  } catch (error) {
    console.error("Usage fetch error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
