import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { getUsageForDevice } from "$lib/server/services/usage"

export const GET: RequestHandler = async ({ url }) => {
  const fingerprint = url.searchParams.get("fp")

  if (!fingerprint) {
    return json({ error: "Missing fingerprint" }, { status: 400 })
  }

  try {
    const usage = await getUsageForDevice(fingerprint)
    return json(usage)
  } catch (error) {
    console.error("Usage fetch error:", error)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}
