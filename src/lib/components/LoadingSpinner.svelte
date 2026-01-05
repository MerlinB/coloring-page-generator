<script lang="ts">
  // Child-friendly loading animation
</script>

<div class="flex flex-col items-center justify-center py-12">
  <div class="relative">
    <!-- Animated circles -->
    <div class="flex gap-2">
      <div
        class="h-4 w-4 animate-bounce rounded-full bg-purple-500"
        style="animation-delay: 0ms;"
      ></div>
      <div
        class="h-4 w-4 animate-bounce rounded-full bg-pink-500"
        style="animation-delay: 150ms;"
      ></div>
      <div
        class="h-4 w-4 animate-bounce rounded-full bg-yellow-500"
        style="animation-delay: 300ms;"
      ></div>
      <div
        class="h-4 w-4 animate-bounce rounded-full bg-cyan-500"
        style="animation-delay: 450ms;"
      ></div>
    </div>
  </div>
  <p class="mt-6 text-xl font-medium text-purple-700">
    Creating your coloring page...
  </p>
  <p class="mt-2 text-sm text-purple-500">This may take a moment</p>
</div>
