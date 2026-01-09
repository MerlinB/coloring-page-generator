import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { db, redemptionCodes } from "$lib/server/db"
import { eq, and, isNull } from "drizzle-orm"
import {
  validateRedemptionCode,
  formatRedemptionCode,
} from "$lib/server/services/codes"

/**
 * POST /api/redeem
 * Validate a redemption code and return its info.
 * Client stores the code locally and sends it with future requests.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const { code } = body

  if (!code) {
    return json({ error: "Missing code" }, { status: 400 })
  }

  // Validate code format and checksum
  if (!validateRedemptionCode(code)) {
    return json({ error: "Invalid code format" }, { status: 400 })
  }

  // Format to canonical form for database lookup
  const formattedCode = formatRedemptionCode(code)

  // Find code in database (only active codes can be redeemed)
  const existingCode = await db.query.redemptionCodes.findFirst({
    where: and(
      eq(redemptionCodes.code, formattedCode),
      isNull(redemptionCodes.invalidatedAt),
      eq(redemptionCodes.status, "active"),
    ),
  })

  if (!existingCode) {
    return json(
      {
        error: "Code not found, payment pending, or code has been invalidated",
      },
      { status: 404 },
    )
  }

  if (existingCode.remainingTokens <= 0) {
    return json({ error: "This code has no remaining tokens" }, { status: 400 })
  }

  // Return code info - client will store locally and send with future requests
  return json({
    success: true,
    code: formattedCode,
    remainingTokens: existingCode.remainingTokens,
  })
}
