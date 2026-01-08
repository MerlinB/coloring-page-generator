/**
 * Redemption code generation and validation.
 * Format: COLOR-XXXX-XXXX (8 characters after prefix)
 * Character set excludes confusing characters (O, I, L, 0, 1)
 */

// 31 characters: 2-9, A-H, J-K, M-N, P-Z (excludes 0, 1, I, L, O)
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Calculate Luhn-style checksum for a string.
 * Uses character position in charset weighted by position.
 */
function calculateChecksum(input: string): string {
	let sum = 0;
	for (let i = 0; i < input.length; i++) {
		const charIndex = CHARSET.indexOf(input[i]);
		if (charIndex === -1) {
			throw new Error(`Invalid character in input: ${input[i]}`);
		}
		sum += charIndex * (i + 1);
	}
	return CHARSET[sum % CHARSET.length];
}

/**
 * Generate a cryptographically random redemption code.
 * Format: COLOR-XXXX-XXXX where the last character is a checksum.
 */
export function generateRedemptionCode(): string {
	// Generate 7 random characters from charset
	const randomBytes = crypto.getRandomValues(new Uint8Array(7));
	const randomPart = Array.from(randomBytes)
		.map((byte) => CHARSET[byte % CHARSET.length])
		.join('');

	// Calculate checksum for the 7 random characters
	const checksum = calculateChecksum(randomPart);

	// Format: COLOR-XXXX-XXXX (8 chars total after prefix)
	const fullCode = randomPart + checksum;
	return `COLOR-${fullCode.slice(0, 4)}-${fullCode.slice(4, 8)}`;
}

/**
 * Validate a redemption code format and checksum.
 * Accepts formats: COLOR-XXXX-XXXX, COLORXXXXXXXX, XXXX-XXXX, XXXXXXXX
 */
export function validateRedemptionCode(code: string): boolean {
	// Normalize: uppercase and remove prefix/dashes
	const normalized = code.toUpperCase().replace(/^COLOR-?/i, '').replace(/-/g, '');

	// Must be exactly 8 characters
	if (normalized.length !== 8) {
		return false;
	}

	// Validate all characters are in charset
	for (const char of normalized) {
		if (!CHARSET.includes(char)) {
			return false;
		}
	}

	// Validate checksum (last char should match calculated checksum of first 7)
	const input = normalized.slice(0, 7);
	const providedChecksum = normalized[7];
	const expectedChecksum = calculateChecksum(input);

	return providedChecksum === expectedChecksum;
}

/**
 * Format a code string to the canonical display format.
 * Input can be any valid format, output is always COLOR-XXXX-XXXX
 */
export function formatRedemptionCode(code: string): string {
	const normalized = code.toUpperCase().replace(/^COLOR-?/i, '').replace(/-/g, '');
	if (normalized.length !== 8) {
		throw new Error('Invalid code length');
	}
	return `COLOR-${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
}
