<script lang="ts">
	import { browser } from '$app/environment';
	import { gallery } from '$lib/stores/gallery.svelte';
	import { fingerprintStore } from '$lib/stores/fingerprint.svelte';
	import { usageStore } from '$lib/stores/usage.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			gallery.initialize();
			fingerprintStore.initialize();
		}
	});

	// Fetch usage once fingerprint is ready
	$effect(() => {
		if (browser && fingerprintStore.fingerprint && !fingerprintStore.loading) {
			usageStore.fetchUsage(fingerprintStore.fingerprint);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
