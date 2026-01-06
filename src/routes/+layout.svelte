<script lang="ts">
  import { browser } from "$app/environment"
  import { gallery } from "$lib/stores/gallery.svelte"
  import "./layout.css"
  import favicon from "$lib/assets/favicon.svg"

  let { children } = $props()

  $effect(() => {
    if (browser) {
      gallery.initialize()
    }
  })
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
