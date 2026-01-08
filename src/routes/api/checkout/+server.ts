import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe, TOKEN_PACKS, isValidPackType } from '$lib/server/stripe';
import { db, purchases } from '$lib/server/db';

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
			// Enable automatic tax calculation if configured in Stripe
			// automatic_tax: { enabled: true },
			success_url: `${url.origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/purchase/cancelled`,
			metadata: {
				packType,
				tokens: pack.tokens.toString(),
				fingerprint: fingerprint ?? ''
			}
		});

		// Create pending purchase record
		await db.insert(purchases).values({
			stripeSessionId: session.id,
			packType,
			amountCents: pack.amountCents,
			status: 'pending'
		});

		return json({ checkoutUrl: session.url });
	} catch (error) {
		console.error('Checkout error:', error);
		return json({ error: 'Could not create checkout session' }, { status: 500 });
	}
};
