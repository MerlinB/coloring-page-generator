import { browser } from '$app/environment';

export interface UsageState {
	freeRemaining: number;
	tokenBalance: number;
	weekResetDate: string | null;
	activeCode: string | null;
}

type UsageSyncMessage =
	| { type: 'USAGE_UPDATED'; payload: UsageState }
	| { type: 'CODE_REDEEMED'; payload: { code: string; balance: number } };

const CHANNEL_NAME = 'usage-sync';

function createUsageStore() {
	let state = $state<UsageState>({
		freeRemaining: 3,
		tokenBalance: 0,
		weekResetDate: null,
		activeCode: null
	});
	let loading = $state(true);
	let error = $state<string | null>(null);

	let channel: BroadcastChannel | null = null;

	function setupSync() {
		if (!browser || channel) return;

		channel = new BroadcastChannel(CHANNEL_NAME);
		channel.onmessage = (event: MessageEvent<UsageSyncMessage>) => {
			const message = event.data;
			switch (message.type) {
				case 'USAGE_UPDATED':
					state = message.payload;
					break;
				case 'CODE_REDEEMED':
					state = {
						...state,
						tokenBalance: message.payload.balance,
						activeCode: message.payload.code,
						freeRemaining: 0 // Tokens replace free tier
					};
					break;
			}
		};
	}

	function broadcast(message: UsageSyncMessage) {
		channel?.postMessage(message);
	}

	return {
		get state() {
			return state;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		get canGenerate() {
			return state.tokenBalance > 0 || state.freeRemaining > 0;
		},

		get usingTokens() {
			return state.tokenBalance > 0;
		},

		get remainingCount() {
			return state.tokenBalance > 0 ? state.tokenBalance : state.freeRemaining;
		},

		async fetchUsage(fingerprint: string) {
			if (!browser) return;

			setupSync();
			loading = true;
			error = null;

			try {
				const res = await fetch(`/api/usage?fp=${encodeURIComponent(fingerprint)}`);
				if (!res.ok) throw new Error('Failed to fetch usage');

				const data: UsageState = await res.json();
				state = data;
				broadcast({ type: 'USAGE_UPDATED', payload: data });
			} catch (e) {
				console.error('Usage fetch error:', e);
				error = 'Could not load usage data';
			} finally {
				loading = false;
			}
		},

		decrementUsage() {
			if (state.tokenBalance > 0) {
				state = { ...state, tokenBalance: state.tokenBalance - 1 };
			} else if (state.freeRemaining > 0) {
				state = { ...state, freeRemaining: state.freeRemaining - 1 };
			}
			broadcast({ type: 'USAGE_UPDATED', payload: state });
		},

		setTokenBalance(balance: number, code: string) {
			state = {
				...state,
				tokenBalance: balance,
				activeCode: code,
				freeRemaining: 0 // Tokens replace free tier
			};
			broadcast({ type: 'CODE_REDEEMED', payload: { code, balance } });
		},

		updateFromServer(data: UsageState) {
			state = data;
			broadcast({ type: 'USAGE_UPDATED', payload: data });
		},

		destroy() {
			channel?.close();
			channel = null;
		}
	};
}

export const usageStore = createUsageStore();
