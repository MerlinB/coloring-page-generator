import type { Handle } from '@sveltejs/kit';

/**
 * Simple in-memory rate limiting.
 * Note: This resets on server restart. For production with multiple instances,
 * consider using Redis or a distributed cache.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
	'/api/generate': { max: 20, windowMs: 60000 }, // 20 per minute
	'/api/checkout': { max: 10, windowMs: 60000 }, // 10 per minute
	'/api/redeem': { max: 10, windowMs: 60000 } // 10 per minute
};

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;

	lastCleanup = now;
	for (const [key, value] of rateLimitMap.entries()) {
		if (value.resetAt < now) {
			rateLimitMap.delete(key);
		}
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Find matching rate limit rule
	const limitEntry = Object.entries(RATE_LIMITS).find(([prefix]) => path.startsWith(prefix));

	if (limitEntry) {
		const [, limit] = limitEntry;
		const ip = event.getClientAddress();
		const key = `${ip}:${path}`;
		const now = Date.now();

		let entry = rateLimitMap.get(key);

		if (!entry || entry.resetAt < now) {
			entry = { count: 0, resetAt: now + limit.windowMs };
			rateLimitMap.set(key, entry);
		}

		entry.count++;

		if (entry.count > limit.max) {
			return new Response(
				JSON.stringify({
					error: 'Too many requests. Please slow down.',
					retryAfter: Math.ceil((entry.resetAt - now) / 1000)
				}),
				{
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': Math.ceil((entry.resetAt - now) / 1000).toString()
					}
				}
			);
		}

		// Periodic cleanup
		cleanupOldEntries();
	}

	return resolve(event);
};
