import { fail } from "@sveltejs/kit"
import { generateColoringPage } from "$lib/server/gemini"
import type { Actions } from "./$types"

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData()
    const prompt = formData.get("prompt")
    const kidFriendly = formData.get("kidFriendly") === "on"

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
      const result = await generateColoringPage(trimmedPrompt, kidFriendly)

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
}
