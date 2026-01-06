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
5. Gallery store (`$lib/stores/gallery.svelte.ts`) manages state using Svelte 5 runes
6. Images are persisted to IndexedDB (`$lib/db/`) and synced across browser tabs via BroadcastChannel

### Key Files

- `src/lib/server/gemini.ts` - Gemini API integration, prompt engineering for coloring pages
- `src/lib/stores/gallery.svelte.ts` - Client-side state management (images, loading, errors)
- `src/lib/db/` - IndexedDB persistence and cross-tab sync (via `idb` library)
- `src/lib/types.ts` - TypeScript interfaces (`GalleryImage`, `GenerationResult`)

### Components

All components use `@lucide/svelte` for icons.

- `LoadingSpinner.svelte` - Animated loading indicator with brand colors
- `ErrorMessage.svelte` - Dismissable error display
- `SuggestionChips.svelte` - Clickable prompt suggestion chips
- `PromptForm.svelte` - Form input with suggestions, kid-friendly toggle, and submit button
- `ImageViewer.svelte` - Shows current image with download/print actions, or placeholder when empty
- `GalleryItem.svelte` - Individual gallery thumbnail with delete button
- `Gallery.svelte` - Responsive grid of previously generated images

## Design Guidelines

This project has a playful, child-friendly design system targeting kids and parents.

### Design Feel

| Aspect            | Value                                            |
| ----------------- | ------------------------------------------------ |
| **Feel**          | Playful, friendly, warm, approachable            |
| **Heading Font**  | Nunito (rounded sans-serif)                      |
| **Body Font**     | DM Sans                                          |
| **Primary Color** | Coral (`--color-coral-*`)                        |
| **Secondary**     | Mint (`--color-mint-*`)                          |
| **Accent**        | Lavender (`--color-lavender-*`)                  |
| **Border Radius** | Moderate (8-12px base)                           |
| **Shadows**       | Soft, warm-tinted for gentle depth               |
| **Borders**       | Subtle 1px borders + shadows for card definition |
| **Spacing**       | Spacious - breathing room for easy tapping       |
| **Dark Mode**     | Light only                                       |
| **Platform**      | Web (desktop + mobile)                           |

### Design Principles

1. **Child-friendly first** - Large touch targets, clear visuals, nothing overwhelming
2. **Warm and inviting** - Soft pastels, no harsh contrasts
3. **Consistent semantic colors** - Always use tokens (`bg-primary`, `text-foreground`), never raw color values
4. **Accessible** - Maintain proper contrast ratios for readability
5. **No external component libraries** - Build all components in-house using Tailwind

### Tailwind 4 Theming (shadcn-style)

Design tokens are defined in `src/routes/layout.css` following the shadcn pattern:

**1. Raw CSS variables** in `:root` — define actual color values:

```css
:root {
  --background: oklch(0.99 0.01 25);
  --foreground: oklch(0.25 0.02 20);
  --primary: oklch(0.65 0.16 18);
  --radius: 0.625rem;
}
```

**2. `@theme inline`** — bridges CSS variables to Tailwind utilities:

```css
@theme inline {
  --color-background: var(--background); /* → bg-background */
  --color-primary: var(--primary); /* → bg-primary, text-primary */
  --radius-lg: var(--radius); /* → rounded-lg */
}
```

**3. `@theme`** (static) — fonts that don't need CSS variable access:

```css
@theme {
  --font-display: "Nunito", system-ui, sans-serif;
  --font-sans: "DM Sans", system-ui, sans-serif;
}
```

**Note:** Brand colors (coral, mint, lavender) are in `:root` and bridged via `@theme inline`, so they're available both as `var(--coral-500)` and `bg-coral-500`.

### Semantic Color Tokens

| Token                 | Background       | Text                                       |
| --------------------- | ---------------- | ------------------------------------------ |
| background/foreground | `bg-background`  | `text-foreground`                          |
| card                  | `bg-card`        | `text-card-foreground`                     |
| primary               | `bg-primary`     | `text-primary` / `text-primary-foreground` |
| secondary             | `bg-secondary`   | `text-secondary-foreground`                |
| muted                 | `bg-muted`       | `text-muted-foreground`                    |
| accent                | `bg-accent`      | `text-accent-foreground`                   |
| destructive           | `bg-destructive` | `text-destructive`                         |
| success               | `bg-success`     | `text-success`                             |
| warning               | `bg-warning`     | `text-warning`                             |

### Brand Color Scales

Three complete color scales are available for fine-grained control:

- **Coral** (`coral-50` to `coral-950`): Primary warm accent
- **Mint** (`mint-50` to `mint-900`): Secondary cool complement
- **Lavender** (`lavender-50` to `lavender-900`): Accent for chips, highlights

Example usage:

```html
<button class="bg-coral-500 text-white hover:bg-coral-600">
  Primary Button
</button>
<div class="bg-mint-100 text-mint-800">Secondary container</div>
<span class="bg-lavender-50 text-lavender-600">Suggestion chip</span>
```

### Contrast Standards (OKLCH Lightness)

| Requirement           | Minimum Δ Lightness |
| --------------------- | ------------------- |
| Background → Card     | 0.05                |
| Text on any surface   | 0.60                |
| Muted text on surface | 0.35                |
| Border visibility     | 0.08 from surface   |

### Utility Classes

| Class            | Purpose                          |
| ---------------- | -------------------------------- |
| `.font-display`  | Apply Nunito heading font        |
| `.card-elevated` | Card with shadow, no border      |
| `.card-bordered` | Card with subtle border + shadow |

### Interactions

- Use `hover:` states for desktop feedback
- Use `active:scale-[0.98]` for press feedback on buttons
- Smooth transitions: `transition-colors`, `transition-transform`
- Keep animations subtle - this is for kids, not distracting

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
