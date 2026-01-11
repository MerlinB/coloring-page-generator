<!--
  @component Language switcher for changing locale via domain.

  Links to the corresponding domain for each locale rather than using URL paths.
  This ensures each domain serves only one language (no duplicate content).

  @example
  <LanguageSwitcher />
-->
<script lang="ts">
  import { Globe } from "@lucide/svelte"
  import { page } from "$app/state"
  import { locales, getLocale } from "$lib/paraglide/runtime"
  import { buildDomainUrl, type Locale } from "$lib/i18n/domains"

  // Language names in their native form (not translated)
  const languageNames: Record<string, string> = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    es: "Español",
  }

  const currentLocale = $derived(getLocale())

  function getLocaleHref(loc: string): string {
    // Link to the domain for this locale with the current path
    return buildDomainUrl(page.url.pathname, loc as Locale)
  }
</script>

<div class="relative inline-block">
  <div class="flex items-center gap-2">
    <Globe class="h-4 w-4 text-muted-foreground" />
    <div class="flex gap-1">
      {#each locales as loc (loc)}
        {@const isActive = loc === currentLocale}
        <a
          href={getLocaleHref(loc)}
          data-sveltekit-reload
          class="rounded-lg px-2 py-1 text-sm font-medium transition-colors {isActive
            ? 'bg-coral-100 text-coral-700'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
          aria-current={isActive ? "page" : undefined}
        >
          {languageNames[loc] ?? loc.toUpperCase()}
        </a>
      {/each}
    </div>
  </div>
</div>
