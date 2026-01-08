import { json, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import { db, purchases, redemptionCodes } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return json({ error: 'Missing signature' }, { status: 400 });
	}

	const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error('STRIPE_WEBHOOK_SECRET not configured');
		return json({ error: 'Webhook not configured' }, { status: 500 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (error) {
		console.error('Webhook signature verification failed:', error);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object as Stripe.Checkout.Session;

			// Update purchase status
			await db
				.update(purchases)
				.set({
					status: 'completed',
					email: session.customer_details?.email ?? null,
					stripePaymentIntentId: session.payment_intent as string,
					updatedAt: new Date()
				})
				.where(eq(purchases.stripeSessionId, session.id));

			// Get purchase record
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.stripeSessionId, session.id)
			});

			if (!purchase) {
				console.error('Purchase not found for session:', session.id);
				break;
			}

			// Activate the pre-generated redemption code (code was created in checkout endpoint)
			await db
				.update(redemptionCodes)
				.set({ status: 'active' })
				.where(eq(redemptionCodes.purchaseId, purchase.id));

			// Get the code for logging
			const existingCode = await db.query.redemptionCodes.findFirst({
				where: eq(redemptionCodes.purchaseId, purchase.id)
			});

			console.log(
				`Activated code ${existingCode?.code} for session ${session.id} (fingerprint: ${existingCode?.redeemedByFingerprint ?? 'none'})`
			);
			break;
		}

		case 'checkout.session.expired': {
			const session = event.data.object as Stripe.Checkout.Session;

			// Find and clean up pending purchase/code for expired sessions
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.stripeSessionId, session.id)
			});

			if (purchase) {
				// Delete pending redemption code
				await db.delete(redemptionCodes).where(eq(redemptionCodes.purchaseId, purchase.id));

				// Update purchase status to expired
				await db
					.update(purchases)
					.set({ status: 'expired', updatedAt: new Date() })
					.where(eq(purchases.id, purchase.id));

				console.log(`Cleaned up expired session ${session.id}`);
			}
			break;
		}

		case 'charge.refunded': {
			const charge = event.data.object as Stripe.Charge;

			// Find purchase by payment intent
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.stripePaymentIntentId, charge.payment_intent as string)
			});

			if (!purchase) break;

			const refundedTotal = charge.amount_refunded;
			const isFullRefund = refundedTotal >= purchase.amountCents;

			await db
				.update(purchases)
				.set({
					status: isFullRefund ? 'refunded' : 'partially_refunded',
					refundedAmountCents: refundedTotal,
					updatedAt: new Date()
				})
				.where(eq(purchases.id, purchase.id));

			// Invalidate code on full refund
			if (isFullRefund) {
				await db
					.update(redemptionCodes)
					.set({ invalidatedAt: new Date() })
					.where(eq(redemptionCodes.purchaseId, purchase.id));

				console.log(`Invalidated code for refunded purchase ${purchase.id}`);
			}
			break;
		}
	}

	return text('OK');
};
