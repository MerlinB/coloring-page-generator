<!--
  @component Displays a section of popular tag links for SEO.
  Links to gallery tag pages using native anchor tags.

  @example
  <PopularTagsSection
    tags={[{ slug: "dinosaur", displayName: "Dinosaur" }]}
  />
-->
<script lang="ts">
  import * as m from "$lib/paraglide/messages"

  interface Tag {
    slug: string
    displayName: string
  }

  interface Props {
    tags: Tag[]
  }

  let { tags }: Props = $props()
</script>

{#if tags.length > 0}
  <section class="mx-auto mt-12 max-w-7xl rounded-3xl bg-card p-6 shadow-lg">
    <h2 class="mb-4 font-display text-2xl font-bold text-coral-700">
      {m.home_popular_tags_title()}
    </h2>
    <div class="flex flex-wrap gap-2">
      {#each tags as tag (tag.slug)}
        <a
          href="/{tag.slug}"
          class="rounded-full bg-lavender-50 px-3 py-1 text-sm text-lavender-600 transition-colors hover:bg-lavender-100"
        >
          {tag.displayName}
        </a>
      {/each}
    </div>
  </section>
{/if}
