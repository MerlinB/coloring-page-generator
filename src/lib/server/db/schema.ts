import {
	pgTable,
	text,
	integer,
	timestamp,
	boolean,
	uuid,
	index,
	pgEnum
} from 'drizzle-orm/pg-core';

// Enums
export const purchaseStatusEnum = pgEnum('purchase_status', [
	'pending',
	'completed',
	'refunded',
	'partially_refunded',
	'expired'
]);

export const codeStatusEnum = pgEnum('code_status', ['pending', 'active']);

/**
 * Devices table - tracks free tier usage by device fingerprint.
 * Each device gets 3 free images per week.
 */
export const devices = pgTable(
	'devices',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		fingerprint: text('fingerprint').notNull().unique(),
		usageCount: integer('usage_count').notNull().default(0),
		weekStartedAt: timestamp('week_started_at', { withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('devices_fingerprint_idx').on(table.fingerprint)]
);

/**
 * Redemption codes table - stores purchased token codes.
 * Format: COLOR-XXXX-XXXX with Luhn-style checksum.
 */
export const redemptionCodes = pgTable(
	'redemption_codes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		code: text('code').notNull().unique(),
		initialTokens: integer('initial_tokens').notNull(),
		remainingTokens: integer('remaining_tokens').notNull(),
		status: codeStatusEnum('status').notNull().default('pending'),
		purchaseId: uuid('purchase_id').references(() => purchases.id),
		redeemedByFingerprint: text('redeemed_by_fingerprint'),
		redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
		invalidatedAt: timestamp('invalidated_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('redemption_codes_code_idx').on(table.code),
		index('redemption_codes_fingerprint_idx').on(table.redeemedByFingerprint)
	]
);

/**
 * Purchases table - tracks Stripe transactions for audit and receipts.
 */
export const purchases = pgTable(
	'purchases',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		stripeSessionId: text('stripe_session_id').notNull().unique(),
		stripePaymentIntentId: text('stripe_payment_intent_id'),
		email: text('email'),
		packType: text('pack_type').notNull(),
		amountCents: integer('amount_cents').notNull(),
		currency: text('currency').notNull().default('usd'),
		status: purchaseStatusEnum('status').notNull().default('pending'),
		refundedAmountCents: integer('refunded_amount_cents').default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('purchases_session_idx').on(table.stripeSessionId),
		index('purchases_payment_intent_idx').on(table.stripePaymentIntentId)
	]
);

/**
 * Generations table - audit log for all image generations.
 * Tracks whether generation used free tier or tokens.
 */
export const generations = pgTable(
	'generations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		fingerprint: text('fingerprint').notNull(),
		redemptionCodeId: uuid('redemption_code_id').references(() => redemptionCodes.id),
		prompt: text('prompt').notNull(),
		wasFreeTier: boolean('was_free_tier').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('generations_fingerprint_idx').on(table.fingerprint),
		index('generations_created_at_idx').on(table.createdAt)
	]
);

// Type exports for use in services
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type RedemptionCode = typeof redemptionCodes.$inferSelect;
export type NewRedemptionCode = typeof redemptionCodes.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
