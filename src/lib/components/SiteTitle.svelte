<!--
  @component Decorative site title with curved text and playful icons.

  Features:
  - Curved text along an upward arc (banner style)
  - Uppercase letters 40% larger than lowercase
  - Decorative icons in brand colors scattered around
  - Works with any translated title text

  @example
  <SiteTitle title="Coloring Page Generator" />
-->
<script lang="ts">
  import {
    Sparkles,
    Star,
    Pencil,
    Palette,
    Heart,
    Flower2,
  } from "@lucide/svelte"

  interface Props {
    title: string
  }

  let { title }: Props = $props()

  // Process title: convert to uppercase, original capitals rendered larger
  function processTitle(
    text: string,
  ): Array<{ char: string; isOriginalCapital: boolean }> {
    return text.split("").map((char) => ({
      char: char.toUpperCase(),
      isOriginalCapital:
        char === char.toUpperCase() && char !== char.toLowerCase(),
    }))
  }

  let characters = $derived(processTitle(title))

  // Dynamic font size based on title length
  // Base size for ~24 chars, scales down for longer titles
  const BASE_CHARS = 24
  const BASE_SIZE = 4 // rem for lowercase
  const MIN_SIZE = 2.5 // minimum font size

  let fontSize = $derived(() => {
    const length = title.length
    if (length <= BASE_CHARS) return BASE_SIZE
    // Scale down proportionally for longer text
    const scale = BASE_CHARS / length
    return Math.max(MIN_SIZE, BASE_SIZE * scale)
  })

  let capitalSize = $derived(fontSize() * 1.2) // 20% larger
</script>

<div class="relative mx-auto mt-6 w-full max-w-3xl px-4 py-6">
  <!-- Decorative icons - scattered with varied sizes, can overlap text -->
  <Sparkles
    class="absolute -top-6 left-2 h-10 w-10 rotate-12 text-gold-400 sm:left-6 sm:h-14 sm:w-14"
    strokeWidth={2}
    fill="currentColor"
  />
  <Star
    class="absolute -top-4 right-4 h-9 w-9 -rotate-12 text-lavender-500 sm:right-8 sm:h-12 sm:w-12"
    strokeWidth={2}
    fill="currentColor"
  />
  <Pencil
    class="absolute bottom-8 left-[12%] h-8 w-8 rotate-25 text-coral-400 sm:h-10 sm:w-10"
    strokeWidth={2}
    fill="currentColor"
  />
  <Palette
    class="absolute right-[10%] bottom-4 h-11 w-11 rotate-[20deg] text-gold-500 sm:h-14 sm:w-14"
    strokeWidth={1.5}
    fill="currentColor"
  />
  <Heart
    class="absolute -top-8 left-[30%] h-7 w-7 rotate-[15deg] text-coral-300 sm:h-8 sm:w-8"
    strokeWidth={2}
    fill="currentColor"
  />
  <Flower2
    class="absolute -top-10 right-[28%] h-9 w-9 -rotate-[44deg] text-lavender-400 sm:h-11 sm:w-11"
    strokeWidth={1.5}
    fill="currentColor"
  />
  <Star
    class="absolute bottom-12 left-[42%] h-5 w-5 rotate-[35deg] text-gold-300 sm:h-6 sm:w-6"
    strokeWidth={2}
    fill="currentColor"
  />
  <Sparkles
    class="absolute right-[38%] bottom-6 h-8 w-8 -rotate-[15deg] text-lavender-300 sm:h-9 sm:w-9"
    strokeWidth={2}
    fill="currentColor"
  />

  <!-- Curved title SVG -->
  <svg
    viewBox="0 0 700 140"
    class="h-auto w-full overflow-visible"
    role="img"
    aria-label={title}
  >
    <defs>
      <!-- Upward arc path (banner/arch style) - curves UP in the middle -->
      <!-- Path extends far beyond viewBox to accommodate long translations -->
      <path id="title-arc" d="M -500,120 Q 350,-5 1200,120" fill="none" />
    </defs>
    <text
      class="fill-coral-600"
      style="font-family: 'Lilita One', sans-serif;"
      dominant-baseline="alphabetic"
    >
      <textPath href="#title-arc" startOffset="50%" text-anchor="middle">
        {#each characters as { char, isOriginalCapital }, i (i)}
          <tspan
            style="font-size: {isOriginalCapital
              ? capitalSize
              : fontSize()}rem;"
            dominant-baseline="alphabetic">{char}</tspan
          >
        {/each}
      </textPath>
    </text>
  </svg>
</div>
