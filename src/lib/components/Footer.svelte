<!--
  @component Simple footer with operator name and support email for legal compliance.
-->
<script lang="ts">
  import { Mail } from "@lucide/svelte"
  import * as m from "$lib/paraglide/messages"
</script>

<footer class="mt-12 border-t border-border bg-muted px-4 py-6">
  <div
    class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row"
  >
    <span>Perennial Labs LLC</span>
    <a
      href="mailto:info@perenniallabs.org"
      class="flex items-center gap-1.5 transition-colors hover:text-foreground"
    >
      <Mail class="h-4 w-4" />
      info@perenniallabs.org
    </a>
  </div>
</footer>
