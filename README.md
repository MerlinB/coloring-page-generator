# Coloring Page Generator

A web app that generates coloring pages using Google's Gemini image generation API.

## Features

- Text-to-image coloring page generation
- Optional kid-friendly mode for simpler, age-appropriate designs
- Persistent gallery stored locally in browser (IndexedDB)
- Real-time sync across browser tabs
- Download and print functionality
- Freemium model: 5 free images/week, token packs via Stripe
- Public gallery with SEO-optimized landing pages per tag (e.g., `/coloring-pages/dinosaur`)
- Multi-language support with domain-based localization

## Setup

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Create a `.env` file:

   ```
   GEMINI_API_KEY=your_api_key_here
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   ```

3. Run database migrations:

   ```sh
   pnpm db:migrate
   ```

4. Start the dev server:
   ```sh
   pnpm dev
   ```

## Tech Stack

- SvelteKit 2 + Svelte 5
- Tailwind CSS
- Google Gemini API
- Neon PostgreSQL + Drizzle ORM
- Stripe Payments
- Vercel Blob (image storage)
- Paraglide (i18n)
