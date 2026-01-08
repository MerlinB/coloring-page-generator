/**
 * Setup script for Stripe products and prices.
 * Run once: pnpm tsx scripts/setup-stripe-products.ts
 *
 * This script is idempotent - it will:
 * - Create products if they don't exist (identified by metadata.pack_id)
 * - Create prices for products
 * - Output configuration to copy into src/lib/server/stripe.ts
 */

import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables
config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
	console.error('Error: STRIPE_SECRET_KEY not found in environment');
	process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PACKS = [
	{
		id: 'starter',
		name: 'Starter Pack',
		description: '47 coloring page images - Perfect for a rainy day',
		tokens: 47,
		amountCents: 499
	},
	{
		id: 'family',
		name: 'Family Pack',
		description: '107 coloring page images - Great for parties & holidays',
		tokens: 107,
		amountCents: 999
	},
	{
		id: 'classroom',
		name: 'Classroom Pack',
		description: '239 coloring page images - Best value for teachers',
		tokens: 239,
		amountCents: 1999
	}
] as const;

async function findExistingProduct(packId: string): Promise<Stripe.Product | null> {
	const products = await stripe.products.search({
		query: `metadata['pack_id']:'${packId}'`
	});
	return products.data[0] ?? null;
}

async function createOrGetProduct(pack: (typeof PACKS)[number]): Promise<Stripe.Product> {
	const existing = await findExistingProduct(pack.id);

	if (existing) {
		console.log(`  Found existing product for ${pack.id}: ${existing.id}`);
		return existing;
	}

	const product = await stripe.products.create({
		name: pack.name,
		description: pack.description,
		metadata: {
			pack_id: pack.id,
			tokens: pack.tokens.toString()
		}
	});

	console.log(`  Created new product for ${pack.id}: ${product.id}`);
	return product;
}

async function findActivePrice(productId: string): Promise<Stripe.Price | null> {
	const prices = await stripe.prices.list({
		product: productId,
		active: true,
		limit: 1
	});
	return prices.data[0] ?? null;
}

async function createOrGetPrice(
	product: Stripe.Product,
	pack: (typeof PACKS)[number]
): Promise<Stripe.Price> {
	const existing = await findActivePrice(product.id);

	if (existing && existing.unit_amount === pack.amountCents) {
		console.log(`  Found existing price for ${pack.id}: ${existing.id}`);
		return existing;
	}

	// If existing price has different amount, deactivate it
	if (existing) {
		console.log(`  Deactivating old price with different amount: ${existing.id}`);
		await stripe.prices.update(existing.id, { active: false });
	}

	const price = await stripe.prices.create({
		product: product.id,
		unit_amount: pack.amountCents,
		currency: 'usd',
		metadata: {
			pack_id: pack.id,
			tokens: pack.tokens.toString()
		}
	});

	console.log(`  Created new price for ${pack.id}: ${price.id}`);
	return price;
}

async function main() {
	console.log('Setting up Stripe products...\n');

	const results: Record<string, { productId: string; priceId: string }> = {};

	for (const pack of PACKS) {
		console.log(`Processing ${pack.name}...`);

		const product = await createOrGetProduct(pack);
		const price = await createOrGetPrice(product, pack);

		results[pack.id] = {
			productId: product.id,
			priceId: price.id
		};
	}

	console.log('\n=== Setup Complete ===\n');
	console.log('Update src/lib/server/stripe.ts with these price IDs:\n');
	console.log('export const TOKEN_PACKS = {');

	for (const pack of PACKS) {
		const result = results[pack.id];
		console.log(`  ${pack.id}: {`);
		console.log(`    name: '${pack.name}',`);
		console.log(`    description: '${pack.description}',`);
		console.log(`    tokens: ${pack.tokens},`);
		console.log(`    amountCents: ${pack.amountCents},`);
		console.log(`    priceId: '${result.priceId}'`);
		console.log(`  },`);
	}

	console.log('} as const;');
	console.log('\n');
}

main().catch((error) => {
	console.error('Setup failed:', error);
	process.exit(1);
});
