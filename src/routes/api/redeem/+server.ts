import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { db, redemptionCodes } from "$lib/server/db"
import { eq, and, isNull } from "drizzle-orm"
import {
  validateRedemptionCode,
  formatRedemptionCode,
} from "$lib/server/services/codes"

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const { code, fingerprint } = body

  if (!code || !fingerprint) {
    return json({ error: "Missing code or fingerprint" }, { status: 400 })
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

  // Check if already redeemed by a different device
  if (
    existingCode.redeemedByFingerprint &&
    existingCode.redeemedByFingerprint !== fingerprint
  ) {
    return json(
      {
        error: "This code has already been redeemed on another device",
      },
      { status: 400 },
    )
  }

  // Redeem code if not already redeemed
  if (!existingCode.redeemedAt) {
    await db
      .update(redemptionCodes)
      .set({
        redeemedByFingerprint: fingerprint,
        redeemedAt: new Date(),
      })
      .where(eq(redemptionCodes.id, existingCode.id))
  }

  // Get total balance for this device (sum of all active redeemed codes)
  const allCodes = await db.query.redemptionCodes.findMany({
    where: and(
      eq(redemptionCodes.redeemedByFingerprint, fingerprint),
      isNull(redemptionCodes.invalidatedAt),
      eq(redemptionCodes.status, "active"),
    ),
  })

  const totalBalance = allCodes.reduce((sum, c) => sum + c.remainingTokens, 0)

  // Build codes breakdown (only include codes with remaining tokens)
  const activeCodes = allCodes
    .filter((c) => c.remainingTokens > 0)
    .map((c) => ({ code: c.code, remainingTokens: c.remainingTokens }))

  return json({
    success: true,
    code: formattedCode,
    remainingTokens: existingCode.remainingTokens,
    totalBalance,
    activeCodes,
  })
}
