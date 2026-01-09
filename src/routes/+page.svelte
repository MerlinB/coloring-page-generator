<script lang="ts">
  import { gallery } from "$lib/stores/gallery.svelte"
  import { fingerprintStore } from "$lib/stores/fingerprint.svelte"
  import { usageStore } from "$lib/stores/usage.svelte"
  import PromptForm from "$lib/components/PromptForm.svelte"
  import ImageViewer from "$lib/components/ImageViewer.svelte"
  import Gallery from "$lib/components/Gallery.svelte"
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte"
  import ErrorMessage from "$lib/components/ErrorMessage.svelte"
  import Lightbox from "$lib/components/Lightbox.svelte"
  import EditPromptModal from "$lib/components/EditPromptModal.svelte"
  import UsageDisplay from "$lib/components/UsageDisplay.svelte"
  import PurchasePrompt from "$lib/components/PurchasePrompt.svelte"
  import RedeemCode from "$lib/components/RedeemCode.svelte"
  import SiteTitle from "$lib/components/SiteTitle.svelte"
  import type { GalleryImage } from "$lib/types"
  import * as m from "$lib/paraglide/messages"

  // Lightbox state
  let lightboxOpen = $state(false)
  let lightboxIndex = $state(0)

  // Edit modal state
  let editModalOpen = $state(false)
  let imageToEdit = $state<GalleryImage | null>(null)

  // Purchase prompt state (will be used when UI components are added)
  let showPurchasePrompt = $state(false)

  function openLightbox(index: number) {
    lightboxIndex = index
    lightboxOpen = true
  }

  function openLightboxForCurrentImage() {
    if (!gallery.currentImage) return
    const index = gallery.images.findIndex(
      (img) => img.id === gallery.currentImage?.id,
    )
    if (index >= 0) {
      openLightbox(index)
    }
  }

  function closeLightbox() {
    lightboxOpen = false
  }

  function navigateLightbox(index: number) {
    if (index >= 0 && index < gallery.images.length) {
      lightboxIndex = index
    }
  }

  // Edit modal functions
  function openEditModal(image: GalleryImage) {
    imageToEdit = image
    editModalOpen = true
    // Close lightbox if open
    lightboxOpen = false
  }

  function closeEditModal() {
    editModalOpen = false
    imageToEdit = null
  }

  function openEditModalForCurrentImage() {
    if (gallery.currentImage) {
      openEditModal(gallery.currentImage)
    }
  }

  // Generation via API
  async function handleGenerate(event: SubmitEvent) {
    event.preventDefault()

    if (!fingerprintStore.fingerprint) {
      gallery.setError(m.common_error_fingerprint())
      return
    }

    // Check if user can generate
    if (!usageStore.canGenerate) {
      showPurchasePrompt = true
      return
    }

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)

    gallery.setGenerating(true)
    gallery.clearError()

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: formData.get("prompt"),
          format: formData.get("format"),
          kidFriendly: formData.get("kidFriendly") === "on",
        }),
      })

      const data = await res.json()

      if (res.status === 402) {
        // Payment required - show purchase prompt
        showPurchasePrompt = true
        return
      }

      if (!res.ok) {
        gallery.setError(data.error ?? m.common_error_generation_failed())
        return
      }

      gallery.addImage({
        ...data.image,
        createdAt: new Date(data.image.createdAt),
      })

      // Update usage from response
      if (data.usage) {
        usageStore.updateFromServer(data.usage)
      }

      // Clear the form
      form.reset()
    } catch (e) {
      console.error("Generation error:", e)
      gallery.setError(m.common_error_generic())
    } finally {
      gallery.setGenerating(false)
    }
  }

  // Edit via API
  async function handleEditSubmit(editPrompt: string) {
    if (!imageToEdit || !fingerprintStore.fingerprint) return

    // Check if user can generate
    if (!usageStore.canGenerate) {
      closeEditModal()
      showPurchasePrompt = true
      return
    }

    // Capture image data before closing modal (which sets imageToEdit to null)
    const image = imageToEdit

    closeEditModal()
    gallery.setGenerating(true)
    gallery.clearError()

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editPrompt,
          format: image.format ?? "portrait",
          editMode: true,
          sourceImageData: image.imageData,
          sourcePrompt: image.prompt,
        }),
      })

      const data = await res.json()

      if (res.status === 402) {
        showPurchasePrompt = true
        return
      }

      if (!res.ok) {
        gallery.setError(data.error ?? m.common_error_edit_failed())
        return
      }

      gallery.addImage({
        ...data.image,
        createdAt: new Date(data.image.createdAt),
        sourceImageId: image.id,
        editPrompt,
      })

      // Update usage from response
      if (data.usage) {
        usageStore.updateFromServer(data.usage)
      }
    } catch (e) {
      console.error("Edit error:", e)
      gallery.setError(m.common_error_generic())
    } finally {
      gallery.setGenerating(false)
    }
  }
</script>

<main class="min-h-screen bg-background px-4 pt-14 pb-8">
  <header class="mx-auto mb-8 max-w-7xl text-center">
    <h1 class="sr-only">{m.site_title()}</h1>
    <SiteTitle title={m.site_title()} />
    <!-- <p class="mx-auto mt-6 max-w-lg text-lg text-muted-foreground sm:text-xl">
      {m.site_tagline()}
    </p> -->
  </header>

  <!-- Split Panel Layout: Form (left) + Image (right) on desktop -->
  <div
    class="mx-auto max-w-2xl space-y-6 lg:grid lg:max-w-7xl lg:grid-cols-[400px_1fr] lg:gap-8 lg:space-y-0 xl:grid-cols-[420px_1fr]"
  >
    <!-- Left Panel: Form + Error + Usage -->
    <div class="order-2 space-y-6 lg:sticky lg:top-8 lg:order-1 lg:self-start">
      <!-- Error Display -->
      {#if gallery.error}
        <ErrorMessage
          message={gallery.error}
          ondismiss={() => gallery.clearError()}
        />
      {/if}

      <!-- Usage Display -->
      <UsageDisplay onpurchase={() => (showPurchasePrompt = true)} />

      <!-- Prompt Input -->
      <section class="rounded-3xl bg-card p-6 shadow-lg">
        <form onsubmit={handleGenerate}>
          <PromptForm disabled={gallery.isGenerating} />
        </form>
      </section>

      <!-- Redeem Code -->
      <RedeemCode />
    </div>

    <!-- Right Panel: Image Viewer -->
    <div class="order-1 lg:order-2">
      {#if gallery.isGenerating}
        <div
          class="flex min-h-[400px] items-center justify-center rounded-3xl bg-card shadow-lg lg:min-h-[500px]"
        >
          <LoadingSpinner />
        </div>
      {:else}
        <ImageViewer
          imageData={gallery.currentImage?.imageData ?? null}
          prompt={gallery.currentImage?.prompt ?? null}
          onexpand={() => openLightboxForCurrentImage()}
          onedit={() => openEditModalForCurrentImage()}
        />
      {/if}
    </div>
  </div>

  <!-- Gallery (full width below split panel) -->
  {#if gallery.images.length > 0}
    <section class="mx-auto mt-8 max-w-7xl rounded-3xl bg-card p-6 shadow-lg">
      <h2 class="mb-4 font-display text-2xl font-bold text-coral-700">
        {m.home_gallery_title()}
      </h2>
      <Gallery
        images={gallery.images}
        onselect={(index) => openLightbox(index)}
        ondelete={(id) => gallery.removeImage(id)}
        onedit={(image) => openEditModal(image)}
      />
    </section>
  {/if}
</main>

<!-- Lightbox overlay -->
{#if lightboxOpen && gallery.images.length > 0}
  <Lightbox
    images={gallery.images}
    currentIndex={lightboxIndex}
    onclose={() => closeLightbox()}
    onnavigate={(index) => navigateLightbox(index)}
    ondelete={(id) => gallery.removeImage(id)}
    onedit={(image) => openEditModal(image)}
  />
{/if}

<!-- Edit modal -->
<EditPromptModal
  open={editModalOpen}
  image={imageToEdit}
  onsubmit={(editPrompt) => handleEditSubmit(editPrompt)}
  onclose={() => closeEditModal()}
/>

<!-- Purchase prompt modal -->
<PurchasePrompt
  open={showPurchasePrompt}
  onclose={() => (showPurchasePrompt = false)}
/>
