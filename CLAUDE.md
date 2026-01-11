# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm preview        # Preview production build
pnpm check          # Type-check with svelte-check
pnpm check:watch    # Type-check in watch mode
pnpm lint           # Run prettier and eslint checks
pnpm format         # Format code with prettier
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run Drizzle migrations
pnpm db:studio      # Open Drizzle Studio
pnpm translate-tags # Batch translate gallery tags to a new locale
pnpm generate-suggestions # Batch generate prompt suggestions for tag translations
```

## Architecture

This is a coloring page generator web app using SvelteKit and Google's Gemini image generation API.

### Data Flow

1. User submits prompt via `+page.svelte`, calls `/api/generate` endpoint
2. Server checks usage (free tier or token balance) via `$lib/server/services/usage.ts`
3. `$lib/server/gemini.ts` constructs prompts and calls Gemini API
4. Generated image (base64) returned to client, stored in gallery store
5. Usage consumed after successful generation
6. Gallery persisted to IndexedDB, synced across tabs via BroadcastChannel
7. Client fires async request to `/api/gallery/save` (fire-and-forget)
8. Server uploads image to Vercel Blob, extracts tags via Gemini, saves to public gallery DB

### Key Files

- `src/lib/server/gemini.ts` - Gemini API integration, prompt engineering
- `src/lib/server/db/` - Drizzle schema and Neon connection
- `src/lib/server/services/usage.ts` - Free tier and token balance logic
- `src/lib/server/services/codes.ts` - Redemption code generation (COLOR-XXXX-XXXX)
- `src/lib/server/services/gallery.ts` - Public gallery save and query
- `src/lib/server/services/tagging.ts` - LLM-based tag extraction and content filtering
- `src/lib/server/services/tagTranslation.ts` - Multi-language tag translation
- `src/lib/server/services/blob.ts` - Vercel Blob storage wrapper
- `src/lib/server/stripe.ts` - Stripe client and price configuration
- `src/lib/stores/usage.svelte.ts` - Client-side usage state with cross-tab sync
- `src/lib/stores/gallery.svelte.ts` - Client-side image gallery state (+ async public gallery save)
- `src/lib/i18n/galleryRoutes.ts` - Gallery URL path helpers
- `src/routes/[tag]/` - Public gallery tag pages (root-level, locale-aware)
- `src/routes/api/` - API endpoints (generate, checkout, redeem, usage, webhooks, gallery/save)

### Components

All components use `@lucide/svelte` for icons.

- `LoadingSpinner.svelte` - Animated loading indicator with brand colors
- `ErrorMessage.svelte` - Dismissable error display
- `SuggestionChips.svelte` - Clickable prompt suggestion chips
- `PromptForm.svelte` - Form input with suggestions, kid-friendly toggle, and submit button
- `ImageViewer.svelte` - Shows current image with download/print actions, or placeholder when empty
- `GalleryItem.svelte` - Individual gallery thumbnail with delete button
- `Gallery.svelte` - Responsive grid of previously generated images
- `LanguageSwitcher.svelte` - Language toggle linking to localized domains
- `GalleryLandingPage.svelte` - SEO landing page for public gallery tags
- `PublicGalleryItem.svelte` - Public gallery image card with "create similar" link

## Internationalization (i18n)

The app uses `@inlang/paraglide-js` for localization with domain-based locale detection.

### Domains

| Domain                         | Locale | Description           |
| ------------------------------ | ------ | --------------------- |
| `makecoloringpages.com`        | `en`   | English (base locale) |
| `ausmalbilder-generator.de`    | `de`   | German                |
| `generateurcoloriages.com`     | `fr`   | French                |
| `generadordibujoscolorear.com` | `es`   | Spanish               |

### Key Files

- `src/lib/i18n/domains.ts` - **Single source of truth** for supported locales, domain mappings
- `project.inlang/settings.json` - Paraglide config (must match `SUPPORTED_LOCALES` in domains.ts)
- `messages/*.json` - Translation files (en, de, fr, es)
- `src/lib/paraglide/` - Auto-generated runtime (do not edit)
- `src/lib/i18n/client.ts` - Client-side locale detection from HTML lang
- `src/hooks.server.ts` - Domain-to-locale detection via overwriteGetLocale
- `src/hooks.ts` - URL rerouting for locale paths (safety net)
- `src/lib/components/LanguageSwitcher.svelte` - Domain-based language toggle

### Domain Detection

Locale is determined by hostname via `src/lib/i18n/domains.ts` (see Domains table above). The implementation uses `overwriteGetLocale()` with `AsyncLocalStorage` (per paraglide docs):

- **Server**: `hooks.server.ts` detects hostname, stores locale in `AsyncLocalStorage`, `getLocale()` returns it
- **Client**: `src/lib/i18n/client.ts` reads from `document.documentElement.lang` (set during SSR)

The domain-to-locale mapping is centralized in `src/lib/i18n/domains.ts` and used by:

- `src/hooks.server.ts` for server-side locale detection
- `src/lib/i18n/client.ts` for client-side locale detection
- `LanguageSwitcher.svelte` for cross-domain language links
- `+layout.svelte` for hreflang SEO tags

The language switcher links directly to the other domain (not URL paths) to avoid duplicate content.

### Adding a New Language

1. Add locale to `SUPPORTED_LOCALES` and domain mappings in `src/lib/i18n/domains.ts`:

   ```typescript
   // Add to SUPPORTED_LOCALES array
   export const SUPPORTED_LOCALES = ["en", "de", "fr", "es", "it"] as const

   // Add to DOMAIN_LOCALE_MAP
   'disegni-da-colorare.it': 'it',
   'www.disegni-da-colorare.it': 'it',

   // Add to LOCALE_DOMAIN_MAP
   it: 'https://www.disegni-da-colorare.it'
   ```

2. Update `project.inlang/settings.json` to match:

   ```json
   "locales": ["en", "de", "fr", "es", "it"]
   ```

3. Create translation file `messages/it.json` (copy from `en.json` and translate)

4. Add native language name to `LanguageSwitcher.svelte`:

   ```typescript
   const languageNames: Record<string, string> = {
     en: "English",
     de: "Deutsch",
     fr: "Français",
     es: "Español",
     it: "Italiano",
   }
   ```

5. Run `pnpm translate-tags it` to batch-translate existing tags to the new locale

6. Point the new domain DNS to Vercel

### Using Messages in Components

```svelte
<script>
  import * as m from "$lib/paraglide/messages"
</script>

<h1>{m.site_title()}</h1><p>{m.usage_images_remaining({ count: "5" })}</p>
```

## SEO

- `src/routes/+layout.svelte` - Global meta tags (title, description, OG, Twitter, hreflang, JSON-LD)
- `src/routes/sitemap.xml/+server.ts` - Dynamic, locale-aware XML sitemap
- `src/routes/+error.svelte` - Custom 404/500 error page
- `static/robots.txt` - Disallows `/api/` and `/purchase/`, references all domain sitemaps

**New pages**: Public pages use layout defaults. Transactional pages (purchase flow, errors) should add `<meta name="robots" content="noindex, nofollow" />`

## Design Guidelines

This project has a playful, child-friendly design system targeting kids and parents.

### Design Feel

| Aspect            | Value                                            |
| ----------------- | ------------------------------------------------ |
| **Feel**          | Playful, friendly, warm, approachable            |
| **Heading Font**  | Nunito (rounded sans-serif)                      |
| **Body Font**     | DM Sans                                          |
| **Primary Color** | Coral (`--color-coral-*`)                        |
| **Secondary**     | Gold (`--color-gold-*`)                          |
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

**Note:** Brand colors (coral, gold, lavender) are in `:root` and bridged via `@theme inline`, so they're available both as `var(--coral-500)` and `bg-coral-500`.

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
- **Gold** (`gold-50` to `gold-900`): Secondary warm complement
- **Lavender** (`lavender-50` to `lavender-900`): Accent for chips, highlights

Example usage:

```html
<button class="bg-coral-500 text-white hover:bg-coral-600">
  Primary Button
</button>
<div class="bg-gold-100 text-gold-800">Secondary container</div>
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

Required in `.env`:

- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - Neon PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (for public gallery images)

## Google Cloud Quotas

API quotas configured in Google Cloud Console (IAM & Admin → Quotas & System Limits):

| Quota                                         | Model            | Limit |
| --------------------------------------------- | ---------------- | ----- |
| Request limit per model per day for a project | gemini-2.5-flash | 1,000 |

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
