import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getUsageForDevice } from "$lib/server/services/usage"

export const GET: RequestHandler = async ({ locals }) => {
  const fingerprint = locals.fingerprint

  try {
    const usage = await getUsageForDevice(fingerprint)
    return json(usage)
  } catch (error) {
    console.error("Usage fetch error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
