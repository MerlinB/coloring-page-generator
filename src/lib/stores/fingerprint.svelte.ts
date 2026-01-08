import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { browser } from '$app/environment';

const FALLBACK_KEY = 'coloring_device_id';

function createFingerprintStore() {
	let fingerprint = $state<string | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let initialized = $state(false);

	return {
		get fingerprint() {
			return fingerprint;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get isInitialized() {
			return initialized;
		},

		async initialize() {
			if (!browser || initialized) return;

			try {
				const fp = await FingerprintJS.load();
				const result = await fp.get();
				fingerprint = result.visitorId;
			} catch (e) {
				console.error('Fingerprint error:', e);
				error = 'Could not identify device';

				// Fallback to localStorage-based ID
				const stored = localStorage.getItem(FALLBACK_KEY);
				if (stored) {
					fingerprint = stored;
				} else {
					fingerprint = crypto.randomUUID();
					localStorage.setItem(FALLBACK_KEY, fingerprint);
				}
			} finally {
				loading = false;
				initialized = true;
			}
		}
	};
}

export const fingerprintStore = createFingerprintStore();
