import type { PageServerLoad } from "./$types"
import { db, redemptionCodes, purchases } from "$lib/server/db"
import { eq } from "drizzle-orm"

export const load: PageServerLoad = async ({ url }) => {
  const sessionId = url.searchParams.get("session_id")

  if (!sessionId) {
    return { code: null, tokens: 0, status: null }
  }

  // Find purchase and associated code
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.stripeSessionId, sessionId),
  })

  if (!purchase) {
    return { code: null, tokens: 0, status: null }
  }

  const code = await db.query.redemptionCodes.findFirst({
    where: eq(redemptionCodes.purchaseId, purchase.id),
  })

  return {
    code: code?.code ?? null,
    tokens: code?.initialTokens ?? 0,
    status: code?.status ?? null,
  }
}
