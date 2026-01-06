<!--
  @component Displays an error message with a dismiss button.

  @example
  <ErrorMessage message="Something went wrong" ondismiss={() => clearError()} />
-->
<script lang="ts">
  import { X } from "@lucide/svelte"

  interface Props {
    message: string
    ondismiss: () => void
  }

  let { message, ondismiss }: Props = $props()
</script>

<div
  class="rounded-2xl border-2 border-coral-200 bg-coral-50 p-4 text-center"
  role="alert"
>
  <p class="font-medium text-coral-700">{message}</p>
  <button
    type="button"
    onclick={() => ondismiss()}
    class="mt-2 inline-flex items-center gap-1 text-sm text-coral-600 transition-colors hover:text-coral-800"
  >
    <X class="h-4 w-4" />
    Dismiss
  </button>
</div>
