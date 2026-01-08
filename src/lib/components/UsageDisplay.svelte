<!--
  @component Displays current usage status (free tier or token balance).

  @example
  <UsageDisplay onpurchase={() => showPurchaseModal = true} />
-->
<script lang="ts">
	import { Sparkles, Clock, Plus } from '@lucide/svelte';
	import { usageStore } from '$lib/stores/usage.svelte';

	interface Props {
		onpurchase?: () => void;
	}

	let { onpurchase }: Props = $props();

	function formatResetTime(isoDate: string | null): string {
		if (!isoDate) return '';
		const reset = new Date(isoDate);
		const now = new Date();
		const diffMs = reset.getTime() - now.getTime();
		const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (days <= 0) return 'today';
		if (days === 1) return 'tomorrow';
		return `in ${days} days`;
	}
</script>

<div class="rounded-2xl bg-gold-50 p-4">
	{#if usageStore.loading}
		<div class="h-6 w-32 animate-pulse rounded bg-gold-200"></div>
	{:else if usageStore.usingTokens}
		<!-- Token balance display -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-gold-600" />
				<span class="font-display font-semibold text-gold-800">
					{usageStore.state.tokenBalance} images remaining
				</span>
			</div>
			{#if onpurchase}
				<button
					type="button"
					onclick={() => onpurchase?.()}
					class="flex items-center gap-1 rounded-full bg-gold-200 px-3 py-1 text-sm font-medium text-gold-800 transition-colors hover:bg-gold-300 active:scale-[0.98]"
				>
					<Plus class="h-4 w-4" />
					<span>Get more</span>
				</button>
			{/if}
		</div>
		{#if usageStore.state.activeCode}
			<p class="mt-1 text-sm text-gold-600">
				Code: {usageStore.state.activeCode}
			</p>
		{/if}
	{:else}
		<!-- Free tier display -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-gold-600" />
				<span class="font-display font-semibold text-gold-800">
					{usageStore.state.freeRemaining} of 3 free images this week
				</span>
			</div>
			{#if onpurchase}
				<button
					type="button"
					onclick={() => onpurchase?.()}
					class="flex items-center gap-1 rounded-full bg-gold-200 px-3 py-1 text-sm font-medium text-gold-800 transition-colors hover:bg-gold-300 active:scale-[0.98]"
				>
					<Plus class="h-4 w-4" />
					<span>Get more</span>
				</button>
			{/if}
		</div>
		{#if usageStore.state.weekResetDate}
			<div class="mt-1 flex items-center gap-1 text-sm text-gold-600">
				<Clock class="h-4 w-4" />
				<span>Resets {formatResetTime(usageStore.state.weekResetDate)}</span>
			</div>
		{/if}
	{/if}
</div>
