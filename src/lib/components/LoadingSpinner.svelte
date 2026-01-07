<!--
  @component Child-friendly loading animation with bouncing dots.

  @example
  <LoadingSpinner />
  <LoadingSpinner message="Almost there..." submessage="Just a few more seconds" />
-->
<script lang="ts">
  interface Props {
    message?: string
    submessage?: string
  }

  let {
    message = "Creating your coloring page...",
    submessage = "This may take a moment",
  }: Props = $props()
</script>

<div class="flex flex-col items-center justify-center py-12">
  <div class="flex gap-2">
    <div
      class="h-4 w-4 animate-bounce rounded-full bg-coral-500"
      style="animation-delay: 0ms;"
    ></div>
    <div
      class="h-4 w-4 animate-bounce rounded-full bg-gold-500"
      style="animation-delay: 150ms;"
    ></div>
    <div
      class="h-4 w-4 animate-bounce rounded-full bg-lavender-500"
      style="animation-delay: 300ms;"
    ></div>
    <div
      class="h-4 w-4 animate-bounce rounded-full bg-coral-400"
      style="animation-delay: 450ms;"
    ></div>
  </div>
  <p class="mt-6 font-display text-xl font-medium text-coral-700">
    {message}
  </p>
  <p class="mt-2 text-sm text-muted-foreground">
    {submessage}
  </p>
</div>
