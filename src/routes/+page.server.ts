import { fail } from "@sveltejs/kit"
import { generateColoringPage, editColoringPage } from "$lib/server/gemini"
import type { Actions } from "./$types"
import type { PageFormat } from "$lib/types"

export const actions: Actions = {
  generate: async ({ request }) => {
    const formData = await request.formData()
    const prompt = formData.get("prompt")
    const kidFriendly = formData.get("kidFriendly") === "on"
    const formatValue = formData.get("format")
    const format: PageFormat =
      formatValue === "landscape" ? "landscape" : "portrait"

    if (!prompt || typeof prompt !== "string") {
      return fail(400, {
        error: "Please tell us what you would like to color!",
        prompt: "",
      })
    }

    const trimmedPrompt = prompt.trim()

    if (trimmedPrompt.length === 0) {
      return fail(400, {
        error: "Please enter a description for your coloring page!",
        prompt: "",
      })
    }

    if (trimmedPrompt.length > 200) {
      return fail(400, {
        error:
          "Your description is too long! Please keep it under 200 characters.",
        prompt: trimmedPrompt,
      })
    }

    try {
      const result = await generateColoringPage(
        trimmedPrompt,
        kidFriendly,
        format,
      )

      if (!result.success || !result.imageData) {
        return fail(500, {
          error:
            result.error ??
            "Could not create your coloring page. Please try again!",
          prompt: trimmedPrompt,
        })
      }

      return {
        success: true,
        image: {
          id: crypto.randomUUID(),
          prompt: trimmedPrompt,
          imageData: result.imageData,
          createdAt: new Date().toISOString(),
          format,
        },
      }
    } catch (err) {
      console.error("Generation error:", err)
      return fail(500, {
        error: "Oops! Something went wrong. Please try again!",
        prompt: trimmedPrompt,
      })
    }
  },

  edit: async ({ request }) => {
    const formData = await request.formData()
    const editPrompt = formData.get("editPrompt")
    const sourceImageData = formData.get("sourceImageData")
    const sourceImageId = formData.get("sourceImageId")
    const sourcePrompt = formData.get("sourcePrompt")
    const formatValue = formData.get("format")
    const format: PageFormat =
      formatValue === "landscape" ? "landscape" : "portrait"

    if (!editPrompt || typeof editPrompt !== "string") {
      return fail(400, {
        error: "Please describe how you want to edit the image!",
        editPrompt: "",
      })
    }

    if (!sourceImageData || typeof sourceImageData !== "string") {
      return fail(400, {
        error: "No source image provided for editing",
        editPrompt,
      })
    }

    const trimmedEditPrompt = editPrompt.trim()

    if (trimmedEditPrompt.length === 0) {
      return fail(400, {
        error: "Please describe your edit!",
        editPrompt: "",
      })
    }

    if (trimmedEditPrompt.length > 200) {
      return fail(400, {
        error:
          "Edit description too long! Please keep it under 200 characters.",
        editPrompt: trimmedEditPrompt,
      })
    }

    try {
      const result = await editColoringPage(
        sourceImageData,
        trimmedEditPrompt,
        false,
        format,
      )

      if (!result.success || !result.imageData) {
        return fail(500, {
          error:
            result.error ??
            "Could not edit your coloring page. Please try again!",
          editPrompt: trimmedEditPrompt,
        })
      }

      const combinedPrompt = `${sourcePrompt} (edited: ${trimmedEditPrompt})`

      return {
        success: true,
        image: {
          id: crypto.randomUUID(),
          prompt: combinedPrompt,
          imageData: result.imageData,
          createdAt: new Date().toISOString(),
          format,
          sourceImageId: sourceImageId as string,
          editPrompt: trimmedEditPrompt,
        },
      }
    } catch (err) {
      console.error("Edit error:", err)
      return fail(500, {
        error: "Oops! Something went wrong. Please try again!",
        editPrompt: trimmedEditPrompt,
      })
    }
  },
}
