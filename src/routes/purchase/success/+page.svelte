<!--
  @component Purchase success page - displays the redemption code after successful payment.
-->
<script lang="ts">
	import { Check, Copy, ArrowLeft } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let copied = $state(false);

	async function copyCode() {
		if (!data.code) return;
		await navigator.clipboard.writeText(data.code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>Purchase Complete - Coloring Page Generator</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-background p-4">
	<div class="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-lg">
		<div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
			<Check class="h-8 w-8 text-success" />
		</div>

		<h1 class="font-display text-3xl font-bold text-coral-700">Thank You!</h1>

		<p class="mt-2 text-muted-foreground">
			Your purchase was successful. Here's your redemption code:
		</p>

		{#if data.code}
			<div class="mt-6 rounded-2xl bg-gold-50 p-4">
				<div class="font-mono text-2xl font-bold tracking-wider text-gold-800">
					{data.code}
				</div>
				<button
					type="button"
					onclick={() => copyCode()}
					class="mt-2 inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-800"
				>
					{#if copied}
						<Check class="h-4 w-4" />
						Copied!
					{:else}
						<Copy class="h-4 w-4" />
						Copy code
					{/if}
				</button>
			</div>

			<div class="mt-4 rounded-xl bg-lavender-50 px-4 py-3">
				<p class="text-sm font-medium text-lavender-700">
					{data.tokens} images included
				</p>
			</div>

			<p class="mt-4 text-sm text-muted-foreground">
				Save this code! You'll also receive it via email. Enter it on any device to use your images.
			</p>
		{:else}
			<div class="mt-6 rounded-2xl bg-gold-50 p-4">
				<p class="text-gold-700">
					Your code is being generated. Please check your email or refresh this page in a moment.
				</p>
			</div>
		{/if}

		<a
			href="/"
			class="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
		>
			<ArrowLeft class="h-5 w-5" />
			Start Creating
		</a>
	</div>
</main>
