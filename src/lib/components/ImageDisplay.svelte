<script lang="ts">
  interface Props {
    imageData: string
    prompt: string
  }

  let { imageData, prompt }: Props = $props()

  function downloadImage() {
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${imageData}`
    link.download = `coloring-page-${Date.now()}.png`
    link.click()
  }

  function printImage() {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
				<html>
					<head><title>Coloring Page - ${prompt}</title></head>
					<body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
						<img src="data:image/png;base64,${imageData}" style="max-width: 100%; max-height: 100vh;" />
					</body>
				</html>
			`)
      printWindow.document.close()
      printWindow.print()
    }
  }
</script>

<div class="flex flex-col items-center">
  <div
    class="relative w-full max-w-md overflow-hidden rounded-2xl border-4 border-purple-200 bg-white shadow-lg"
  >
    <img
      src="data:image/png;base64,{imageData}"
      alt="Coloring page: {prompt}"
      class="h-auto w-full"
    />
  </div>

  <p class="mt-4 text-center text-lg text-purple-600">"{prompt}"</p>

  <div class="mt-4 flex gap-4">
    <button
      onclick={() => downloadImage()}
      class="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-bold text-white transition-transform hover:scale-105 active:scale-95"
    >
      <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download
    </button>

    <button
      onclick={() => printImage()}
      class="flex items-center gap-2 rounded-full border-2 border-purple-500 bg-white px-6 py-3 font-bold text-purple-600 transition-transform hover:scale-105 active:scale-95"
    >
      <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print
    </button>
  </div>
</div>
