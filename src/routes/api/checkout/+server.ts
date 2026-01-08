import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe, TOKEN_PACKS, isValidPackType } from '$lib/server/stripe';
import { db, purchases, redemptionCodes } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { generateRedemptionCode } from '$lib/server/services/codes';

export const POST: RequestHandler = async ({ request, url }) => {
	const body = await request.json();
	const { packType, fingerprint } = body;

	if (!packType || !isValidPackType(packType)) {
		return json({ error: 'Invalid pack type' }, { status: 400 });
	}

	const pack = TOKEN_PACKS[packType];

	if (!pack.priceId) {
		console.error('Price ID not configured for pack:', packType);
		return json({ error: 'Payment system not configured' }, { status: 500 });
	}

	// Pre-generate the redemption code so it can be included in the Stripe invoice
	const code = generateRedemptionCode();

	// Create pending purchase record first (to get ID for redemption code)
	const [purchase] = await db
		.insert(purchases)
		.values({
			stripeSessionId: 'pending', // Placeholder, updated after session creation
			packType,
			amountCents: pack.amountCents,
			status: 'pending'
		})
		.returning();

	// Create pending redemption code linked to purchase
	await db.insert(redemptionCodes).values({
		code,
		initialTokens: pack.tokens,
		remainingTokens: pack.tokens,
		status: 'pending',
		purchaseId: purchase.id,
		// Pre-bind fingerprint for auto-redemption (activated when payment succeeds)
		redeemedByFingerprint: fingerprint ?? null,
		redeemedAt: fingerprint ? new Date() : null
	});

	try {
		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			payment_method_types: ['card'],
			line_items: [
				{
					price: pack.priceId,
					quantity: 1
				}
			],
			success_url: `${url.origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/purchase/cancelled`,
			// Enable invoice creation with redemption code in custom fields
			invoice_creation: {
				enabled: true,
				invoice_data: {
					description: `${pack.name} - ${pack.tokens} coloring page images`,
					custom_fields: [
						{
							name: 'Redemption Code',
							value: code
						}
					],
					footer:
						'Enter this code at the coloring page generator to use your images. Thank you for your purchase!'
				}
			},
			metadata: {
				packType,
				tokens: pack.tokens.toString(),
				fingerprint: fingerprint ?? '',
				redemptionCode: code
			}
		});

		// Update purchase with actual session ID
		await db
			.update(purchases)
			.set({ stripeSessionId: session.id })
			.where(eq(purchases.id, purchase.id));

		return json({ checkoutUrl: session.url });
	} catch (error) {
		// Rollback: delete pending records if Stripe session creation fails
		await db.delete(redemptionCodes).where(eq(redemptionCodes.purchaseId, purchase.id));
		await db.delete(purchases).where(eq(purchases.id, purchase.id));

		console.error('Checkout error:', error);
		return json({ error: 'Could not create checkout session' }, { status: 500 });
	}
};
