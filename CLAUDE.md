# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm check        # Type-check with svelte-check
pnpm check:watch  # Type-check in watch mode
pnpm lint         # Run prettier and eslint checks
pnpm format       # Format code with prettier
```

## Architecture

This is a coloring page generator web app using SvelteKit and Google's Gemini image generation API.

### Data Flow

1. User submits a prompt via form action in `+page.svelte`
2. Server action (`+page.server.ts`) validates input and calls `generateColoringPage()`
3. `$lib/server/gemini.ts` constructs prompts with coloring book requirements and calls Gemini API
4. Generated image (base64) is returned to client and stored in gallery store
5. Gallery store (`$lib/stores/gallery.svelte.ts`) manages in-memory state using Svelte 5 runes

### Key Files

- `src/lib/server/gemini.ts` - Gemini API integration, prompt engineering for coloring pages
- `src/lib/stores/gallery.svelte.ts` - Client-side state management (images, loading, errors)
- `src/lib/types.ts` - TypeScript interfaces (`GalleryImage`, `GenerationResult`)

### Components

- `PromptInput.svelte` - Form input with suggestions and kid-friendly toggle
- `ImageDisplay.svelte` - Shows current image with download/print actions
- `Gallery.svelte` - Grid of previously generated images
- `LoadingSpinner.svelte` - Loading indicator

## Environment

Requires `GEMINI_API_KEY` in `.env` file. Uses the `gemini-3-pro-image-preview` model.
