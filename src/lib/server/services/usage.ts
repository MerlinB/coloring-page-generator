import { db, devices, redemptionCodes, generations } from "$lib/server/db"
import { eq, and, isNull, desc, sql, gt } from "drizzle-orm"

const FREE_TIER_LIMIT = 3
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface CodeBalance {
  code: string
  remainingTokens: number
}

export interface UsageData {
  freeRemaining: number
  tokenBalance: number
  weekResetDate: string | null
  activeCode: string | null
  /** Breakdown of all active codes with their balances */
  activeCodes: CodeBalance[]
}

/**
 * Get usage data for a device fingerprint.
 * Handles weekly reset of free tier and returns current token balance if any.
 */
export async function getUsageForDevice(
  fingerprint: string,
): Promise<UsageData> {
  // Get or create device record
  let device = await db.query.devices.findFirst({
    where: eq(devices.fingerprint, fingerprint),
  })

  const now = new Date()

  if (!device) {
    // Create new device
    const [newDevice] = await db
      .insert(devices)
      .values({
        fingerprint,
        usageCount: 0,
        weekStartedAt: now,
      })
      .returning()
    device = newDevice
  }

  // Check if week has reset
  const weekStart = new Date(device.weekStartedAt)
  if (now.getTime() - weekStart.getTime() > WEEK_MS) {
    // Reset the week
    const [updated] = await db
      .update(devices)
      .set({
        usageCount: 0,
        weekStartedAt: now,
        updatedAt: now,
      })
      .where(eq(devices.id, device.id))
      .returning()
    device = updated
  }

  // Get ALL active redemption codes and sum their balances
  const activeCodes = await db.query.redemptionCodes.findMany({
    where: and(
      eq(redemptionCodes.redeemedByFingerprint, fingerprint),
      eq(redemptionCodes.status, "active"),
      isNull(redemptionCodes.invalidatedAt),
    ),
    orderBy: desc(redemptionCodes.redeemedAt),
  })

  const tokenBalance = activeCodes.reduce(
    (sum, code) => sum + code.remainingTokens,
    0,
  )
  // For activeCode display, show the most recent one (first in array due to ordering)
  const mostRecentCode = activeCodes[0] ?? null
  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - device.usageCount)

  // Calculate next reset
  const nextReset = new Date(weekStart.getTime() + WEEK_MS)

  // Build codes breakdown (only include codes with remaining tokens)
  const codesBreakdown: CodeBalance[] = activeCodes
    .filter((c) => c.remainingTokens > 0)
    .map((c) => ({ code: c.code, remainingTokens: c.remainingTokens }))

  return {
    // Tokens replace free tier - if user has tokens, free tier shows 0
    freeRemaining: tokenBalance > 0 ? 0 : freeRemaining,
    tokenBalance,
    weekResetDate: tokenBalance > 0 ? null : nextReset.toISOString(),
    activeCode: mostRecentCode?.code ?? null,
    activeCodes: codesBreakdown,
  }
}

/**
 * Consume a generation from the user's balance.
 * Prioritizes token balance over free tier.
 */
export async function consumeGeneration(
  fingerprint: string,
  prompt: string,
): Promise<{ success: boolean; error?: string }> {
  const usage = await getUsageForDevice(fingerprint)

  if (usage.tokenBalance > 0) {
    // Find a code with remaining tokens (prefer most recent)
    const activeCode = await db.query.redemptionCodes.findFirst({
      where: and(
        eq(redemptionCodes.redeemedByFingerprint, fingerprint),
        eq(redemptionCodes.status, "active"),
        isNull(redemptionCodes.invalidatedAt),
        gt(redemptionCodes.remainingTokens, 0),
      ),
      orderBy: desc(redemptionCodes.redeemedAt),
    })

    if (!activeCode) {
      return { success: false, error: "No tokens available" }
    }

    await db
      .update(redemptionCodes)
      .set({ remainingTokens: activeCode.remainingTokens - 1 })
      .where(eq(redemptionCodes.id, activeCode.id))

    await db.insert(generations).values({
      fingerprint,
      redemptionCodeId: activeCode.id,
      prompt,
      wasFreeTier: false,
    })

    return { success: true }
  }

  if (usage.freeRemaining > 0) {
    // Consume from free tier
    await db
      .update(devices)
      .set({
        usageCount: sql`${devices.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(devices.fingerprint, fingerprint))

    await db.insert(generations).values({
      fingerprint,
      prompt,
      wasFreeTier: true,
    })

    return { success: true }
  }

  return { success: false, error: "No generations remaining" }
}

/**
 * Check if a device can generate (has tokens or free tier remaining).
 */
export async function canGenerate(fingerprint: string): Promise<boolean> {
  const usage = await getUsageForDevice(fingerprint)
  return usage.tokenBalance > 0 || usage.freeRemaining > 0
}
