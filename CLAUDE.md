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

## Important Conventions

### Database Migrations

- Do not manually edit generated Drizzle migrations in the `drizzle/` directory
- Use `pnpm db:generate` to create custom migrations if needed

### Environment Variables

- Server-side: Import from `$env/dynamic/private` or `$env/static/private`
- Client-side: Import from `$env/dynamic/public` or `$env/static/public`

### Svelte Components

- All components must use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`, etc.)
- Event handlers should be wrapped in arrow functions: `onclick={() => handler()}`
- Avoid deep dependency tracking in `$effect` - use `untrack` when needed
- Document components with an HTML comment at the start of the file:

```svelte
<!--
  @component Brief description of the component.

  @example
  <MyComponent prop="value" />
-->
```

### Git Commit Messages

When you are asked to make a commit, use conventional commits style and do not add claude attribution!

## Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### Available MCP Tools:

#### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

#### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

#### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

#### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
