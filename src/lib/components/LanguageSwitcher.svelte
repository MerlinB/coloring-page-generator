<!--
  @component Language switcher dropdown for changing locale via domain.

  Links to the corresponding domain for each locale rather than using URL paths.
  This ensures each domain serves only one language (no duplicate content).

  @example
  <LanguageSwitcher />
-->
<script lang="ts">
  import { Globe, ChevronDown } from "@lucide/svelte"
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

  let isOpen = $state(false)
  const currentLocale = $derived(getLocale())
  const currentLanguageName = $derived(
    languageNames[currentLocale] ?? currentLocale.toUpperCase()
  )

  function getLocaleHref(loc: string): string {
    return buildDomainUrl(page.url.pathname, loc as Locale)
  }

  function toggleDropdown() {
    isOpen = !isOpen
  }

  function closeDropdown() {
    isOpen = false
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeDropdown()
    }
  }
</script>

<svelte:window onclick={() => closeDropdown()} onkeydown={handleKeydown} />

<div class="relative inline-block">
  <button
    type="button"
    onclick={(e) => {
      e.stopPropagation()
      toggleDropdown()
    }}
    class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
  >
    <Globe class="h-4 w-4" />
    <span>{currentLanguageName}</span>
    <ChevronDown
      class="h-3.5 w-3.5 transition-transform {isOpen ? 'rotate-180' : ''}"
    />
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 z-50 mt-1 min-w-32 rounded-lg border border-border bg-card py-1 shadow-lg"
      role="listbox"
      aria-label="Select language"
    >
      {#each locales as loc (loc)}
        {@const isActive = loc === currentLocale}
        <a
          href={getLocaleHref(loc)}
          data-sveltekit-reload
          onclick={() => closeDropdown()}
          class="block px-3 py-2 text-sm transition-colors {isActive
            ? 'bg-coral-50 font-medium text-coral-700'
            : 'text-foreground hover:bg-muted'}"
          role="option"
          aria-selected={isActive}
        >
          {languageNames[loc] ?? loc.toUpperCase()}
        </a>
      {/each}
    </div>
  {/if}
</div>
