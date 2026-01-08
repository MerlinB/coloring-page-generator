<!--
  @component Modal prompting user to purchase more tokens.

  @example
  <PurchasePrompt open={showPrompt} onclose={() => showPrompt = false} />
-->
<script lang="ts">
	import { X, Sparkles, Gift, School } from '@lucide/svelte';
	import { fingerprintStore } from '$lib/stores/fingerprint.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	let loading = $state<string | null>(null);
	let error = $state<string | null>(null);

	const packs = [
		{
			id: 'starter',
			name: 'Starter',
			images: 47,
			price: '$4.99',
			icon: Sparkles,
			description: 'Perfect for a rainy day'
		},
		{
			id: 'family',
			name: 'Family',
			images: 107,
			price: '$9.99',
			icon: Gift,
			description: 'Great for parties & holidays',
			popular: true
		},
		{
			id: 'classroom',
			name: 'Classroom',
			images: 239,
			price: '$19.99',
			icon: School,
			description: 'Best value for teachers'
		}
	];

	async function handlePurchase(packId: string) {
		loading = packId;
		error = null;

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					packType: packId,
					fingerprint: fingerprintStore.fingerprint
				})
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error ?? 'Checkout failed');
			}

			const { checkoutUrl } = await res.json();
			window.location.href = checkoutUrl;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not start checkout. Please try again.';
			loading = null;
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		tabindex="-1"
	>
		<div class="w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="font-display text-2xl font-bold text-coral-700">Get More Images</h2>
				<button
					type="button"
					onclick={() => onclose()}
					class="rounded-full p-2 text-muted-foreground hover:bg-muted"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if error}
				<div class="mb-4 rounded-xl bg-coral-50 p-3 text-coral-700">
					{error}
				</div>
			{/if}

			<div class="space-y-4">
				{#each packs as pack}
					<button
						type="button"
						onclick={() => handlePurchase(pack.id)}
						disabled={loading !== null}
						class="relative w-full rounded-2xl border-2 p-4 text-left transition-all disabled:opacity-50
              {pack.popular
							? 'border-coral-400 bg-coral-50'
							: 'border-gold-200 bg-gold-50 hover:border-gold-300'}"
					>
						{#if pack.popular}
							<span
								class="absolute -top-3 right-4 rounded-full bg-coral-500 px-3 py-1 text-xs font-bold text-white"
							>
								Most Popular
							</span>
						{/if}

						<div class="flex items-center gap-4">
							<div class="rounded-xl bg-white p-3">
								<pack.icon class="h-6 w-6 text-gold-600" />
							</div>
							<div class="flex-1">
								<div class="font-display text-lg font-bold text-foreground">
									{pack.name} Pack
								</div>
								<div class="text-sm text-muted-foreground">
									{pack.images} images - {pack.description}
								</div>
							</div>
							<div class="font-display text-xl font-bold text-coral-600">
								{loading === pack.id ? '...' : pack.price}
							</div>
						</div>
					</button>
				{/each}
			</div>

			<p class="mt-6 text-center text-sm text-muted-foreground">
				Tokens never expire. Secure checkout via Stripe.
			</p>
		</div>
	</div>
{/if}
