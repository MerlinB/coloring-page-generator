import { db, devices, redemptionCodes, generations } from "$lib/server/db"
import { eq, and, isNull, desc, sql, gt, lt, inArray } from "drizzle-orm"
import { FREE_TIER_LIMIT } from "$lib/constants"
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

    // Atomic decrement with condition to prevent race conditions
    // Only decrements if remainingTokens > 0
    const result = await db
      .update(redemptionCodes)
      .set({ remainingTokens: sql`${redemptionCodes.remainingTokens} - 1` })
      .where(
        and(
          eq(redemptionCodes.id, activeCode.id),
          gt(redemptionCodes.remainingTokens, 0),
        ),
      )
      .returning({ id: redemptionCodes.id })

    // Check if a row was actually updated (race condition protection)
    if (result.length === 0) {
      return { success: false, error: "Token already consumed" }
    }

    await db.insert(generations).values({
      fingerprint,
      redemptionCodeId: activeCode.id,
      prompt,
      wasFreeTier: false,
    })

    return { success: true }
  }

  if (usage.freeRemaining > 0) {
    // Atomic increment with condition to prevent race conditions
    // Only increments if usageCount < FREE_TIER_LIMIT
    const result = await db
      .update(devices)
      .set({
        usageCount: sql`${devices.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(devices.fingerprint, fingerprint),
          lt(devices.usageCount, FREE_TIER_LIMIT),
        ),
      )
      .returning({ id: devices.id })

    // Check if a row was actually updated (race condition protection)
    if (result.length === 0) {
      return { success: false, error: "Free tier already consumed" }
    }

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

// ============================================================================
// CODE-BASED FUNCTIONS (no fingerprint binding)
// ============================================================================

/**
 * Get free tier usage for a device (without code info).
 */
export async function getFreeUsageForDevice(fingerprint: string): Promise<{
  freeRemaining: number
  weekResetDate: string | null
}> {
  // Get or create device record
  let device = await db.query.devices.findFirst({
    where: eq(devices.fingerprint, fingerprint),
  })

  const now = new Date()

  if (!device) {
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

  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - device.usageCount)
  const nextReset = new Date(weekStart.getTime() + WEEK_MS)

  return {
    freeRemaining,
    weekResetDate: nextReset.toISOString(),
  }
}

/**
 * Get total token balance for a list of codes.
 */
export async function getBalanceForCodes(codes: string[]): Promise<number> {
  if (codes.length === 0) return 0

  const validCodes = await db.query.redemptionCodes.findMany({
    where: and(
      inArray(redemptionCodes.code, codes),
      eq(redemptionCodes.status, "active"),
      isNull(redemptionCodes.invalidatedAt),
      gt(redemptionCodes.remainingTokens, 0),
    ),
  })

  return validCodes.reduce((sum, code) => sum + code.remainingTokens, 0)
}

/**
 * Get codes with their individual balances.
 */
export async function getActiveCodesWithBalances(
  codes: string[],
): Promise<CodeBalance[]> {
  if (codes.length === 0) return []

  const validCodes = await db.query.redemptionCodes.findMany({
    where: and(
      inArray(redemptionCodes.code, codes),
      eq(redemptionCodes.status, "active"),
      isNull(redemptionCodes.invalidatedAt),
      gt(redemptionCodes.remainingTokens, 0),
    ),
    orderBy: desc(redemptionCodes.remainingTokens),
  })

  return validCodes.map((c) => ({
    code: c.code,
    remainingTokens: c.remainingTokens,
  }))
}

/**
 * Get combined usage data using client-provided codes + fingerprint for free tier.
 */
export async function getUsageWithCodes(
  fingerprint: string,
  codes: string[],
): Promise<UsageData> {
  const freeUsage = await getFreeUsageForDevice(fingerprint)
  const tokenBalance = await getBalanceForCodes(codes)
  const activeCodes = await getActiveCodesWithBalances(codes)

  return {
    // Tokens replace free tier - if user has tokens, free tier shows 0
    freeRemaining: tokenBalance > 0 ? 0 : freeUsage.freeRemaining,
    tokenBalance,
    weekResetDate: tokenBalance > 0 ? null : freeUsage.weekResetDate,
    activeCode: activeCodes[0]?.code ?? null,
    activeCodes,
  }
}

/**
 * Consume a generation from client-provided codes or free tier.
 */
export async function consumeWithCodes(
  fingerprint: string,
  prompt: string,
  codes: string[],
): Promise<{ success: boolean; consumedCode?: string; error?: string }> {
  // First try to consume from provided codes
  if (codes.length > 0) {
    // Find a code with remaining tokens
    const activeCode = await db.query.redemptionCodes.findFirst({
      where: and(
        inArray(redemptionCodes.code, codes),
        eq(redemptionCodes.status, "active"),
        isNull(redemptionCodes.invalidatedAt),
        gt(redemptionCodes.remainingTokens, 0),
      ),
      orderBy: desc(redemptionCodes.remainingTokens),
    })

    if (activeCode) {
      // Atomic decrement with condition to prevent race conditions
      const result = await db
        .update(redemptionCodes)
        .set({ remainingTokens: sql`${redemptionCodes.remainingTokens} - 1` })
        .where(
          and(
            eq(redemptionCodes.id, activeCode.id),
            gt(redemptionCodes.remainingTokens, 0),
          ),
        )
        .returning({ id: redemptionCodes.id })

      if (result.length > 0) {
        await db.insert(generations).values({
          fingerprint,
          redemptionCodeId: activeCode.id,
          prompt,
          wasFreeTier: false,
        })

        return { success: true, consumedCode: activeCode.code }
      }
      // If update failed (race condition), fall through to try another code or free tier
    }
  }

  // Fall back to free tier
  const freeUsage = await getFreeUsageForDevice(fingerprint)
  if (freeUsage.freeRemaining > 0) {
    const result = await db
      .update(devices)
      .set({
        usageCount: sql`${devices.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(devices.fingerprint, fingerprint),
          lt(devices.usageCount, FREE_TIER_LIMIT),
        ),
      )
      .returning({ id: devices.id })

    if (result.length > 0) {
      await db.insert(generations).values({
        fingerprint,
        prompt,
        wasFreeTier: true,
      })

      return { success: true }
    }
  }

  return { success: false, error: "No generations remaining" }
}
