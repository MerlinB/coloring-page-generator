# Monetization Architecture Decisions

This document captures the high-level architectural decisions for implementing the monetization strategy outlined in `docs/MONETIZATION.md`.

## Overview

A freemium model with weekly free credits and one-time token pack purchases. No user accounts required—tokens are tracked via device fingerprint and redeemable codes.

---

## Architecture Decisions

### Database: Neon (PostgreSQL) + Drizzle

**Decision:** Use Neon (serverless PostgreSQL) with Drizzle ORM.

**Region:** EU (Frankfurt)

**Rationale:**

- Teachers need expense receipts → requires queryable purchase history
- Refund handling needs transactional integrity (ACID)
- Future features (bulk school pricing, referrals) easier to add
- Neon free tier is generous (0.5 GB storage, 190 compute hours/mo)
- Drizzle provides excellent TypeScript DX

**Why EU region:**

- GDPR simpler — no cross-border data transfer documentation for EU users
- ~40% of users expected from EU (VAT regions)
- Stripe handles payment data separately anyway
- Vercel functions can be configured to `fra1` (Frankfurt) to minimize latency

**Environment:**

- `DATABASE_URL` in `.env` (connection string from Neon)

**Rejected alternatives:**

- Redis/Upstash: Limited querying, poor for audit trails and receipts
- US region: Would require GDPR data transfer documentation

---

### Hosting: Vercel

**Decision:** Deploy on Vercel.

**Rationale:**

- Existing SvelteKit support
- Built-in DDoS protection
- Serverless functions for API routes
- Edge network for global performance

---

### Device Fingerprinting: FingerprintJS OSS

**Decision:** Use FingerprintJS open-source library for device identification.

**Rationale:**

- Purely client-side library, no external service or account needed
- Combines ~20+ signals (canvas, audio, fonts, screen) for stable ID
- Free and self-contained
- ~1 in 286,777 browser uniqueness

**Rejected alternatives:**

- Vercel's x-vercel-ja4-digest: TLS fingerprint only identifies browser+OS combinations, not individual users (thousands share same hash)
- FingerprintJS Pro: Requires paid account, unnecessary for our needs
- Custom solution: Less robust, more maintenance

**Installation:**

```bash
pnpm add @fingerprintjs/fingerprintjs
```

---

### Payments: Stripe + PayPal (via Stripe)

**Decision:** Use Stripe as primary payment provider with PayPal enabled through Stripe's payment methods.

**Rationale:**

- Single integration handles both payment methods
- Single webhook endpoint
- Stripe Tax handles VAT automatically
- PayPal via Stripe covers key markets: US, UK, Germany, France, Italy, Spain, Netherlands, Belgium, Austria
- Simplifies v1 implementation

**Rejected alternatives:**

- Direct PayPal integration: More code, separate webhooks, separate balance—can add later if needed for other regions

---

### VAT Handling: Stripe Tax

**Decision:** Use Stripe Tax for automatic VAT calculation and collection.

**Rationale:**

- Automatic VAT calculation based on customer location
- Handles EU VAT requirements
- VAT-inclusive pricing (same price displayed everywhere)
- Automatic remittance in supported regions

---

### Email & Receipts: Stripe (Required Email)

**Decision:** Require email at checkout, let Stripe handle receipt delivery.

**Rationale:**

- Stripe Checkout collects email
- Stripe sends automatic receipts with redemption code in metadata
- No separate email provider needed
- Guarantees recovery path for all purchases

**Rejected alternatives:**

- Optional email: Complicates recovery, no real benefit
- Separate email provider (Resend, SendGrid): Unnecessary complexity

---

### Code Format: Readable + Checksum

**Decision:** Use format `COLOR-XXXX-XXXX` with checksum digit.

**Example:** `COLOR-A7X9-B3M2`

**Rationale:**

- Human-readable and easy to type
- Checksum prevents typos from being accepted
- ~2.8 billion combinations (sufficient entropy)
- Prefix makes it recognizable

---

### Code Delivery: Immediate + Email Backup

**Decision:** Save code to localStorage immediately on checkout success, with Stripe email as backup.

**Flow:**

1. User completes Stripe Checkout
2. Stripe redirects to `/checkout/success?session_id=cs_xxx`
3. Success page fetches session, extracts code from metadata
4. Immediately saves to localStorage
5. Displays code to user
6. Stripe sends email receipt async (with same code)

**Rationale:**

- User has code instantly (no waiting for email)
- Email provides recovery if localStorage cleared
- No custom email infrastructure needed

---

### Code Recovery: Via Stripe Email Receipt

**Decision:** Recovery is via the Stripe email receipt containing the redemption code.

**Rationale:**

- Email is required at checkout → receipt always sent
- Redemption code included in receipt metadata
- Zero support burden
- No custom recovery flow needed

---

### Rate Limiting: None

**Decision:** Do not implement dedicated rate limiting infrastructure.

**Rationale:**

- DDoS protection: Handled by Vercel automatically
- Image generation abuse: Gated by token system (free tier limit + paid balance)
- Code guessing: Prevented by checksum + entropy (~2.8B combinations)
- API spam: Just DB reads, negligible cost

The token system IS the rate limiting for the expensive operation.

---

### Analytics: Deferred

**Decision:** Implement analytics later.

**Candidates:** Posthog or Plausible (both can be privacy-friendly).

---

## Token & Free Tier Rules

### Free Tier vs Paid Tokens

**Decision:** Paid tokens replace free tier.

Once a user redeems a code, they no longer receive weekly free images. Their balance is purely their purchased tokens.

**Rationale:**

- Simpler UX — one number to track ("You have 47 images")
- 3 free/week = ~$0.12 value, negligible compared to $4.99+ purchase
- Reduces ongoing cost of supporting paying users

### Multiple Code Redemption

**Decision:** Balances stack.

If a user enters a second code, the token counts add together.

**Rationale:**

- User-friendly for teachers buying multiple packs
- No tokens are "wasted"

### Refunds

**Decision:** Auto-invalidate code on full refund.

- Full refund via Stripe → webhook sets code balance to 0
- Partial refund → same behavior (simplicity over edge case handling)
- If tokens already used → allow refund anyway (prefer losing money over manual handling)
- Track refund count per email to detect abuse patterns
- Consider blocking repeat refunders (future improvement)

### Fingerprint Abuse

**Decision:** Accept the risk for now.

Users who clear browser data get a fresh fingerprint and new free tier. This is acceptable because:

- Cost per abuse: ~$0.12/week
- Effort required: Clear all browser data weekly
- Most users won't bother

**Future improvement:** Add IP-based tracking if abuse becomes measurable. Noted but deferred due to:

- Privacy implications of storing IPs
- VPNs make it easy to bypass anyway

### Cross-Tab Token Sync

**Decision:** Yes, sync token balance across tabs.

Use existing BroadcastChannel pattern (already used for gallery) to sync token state.

---

## Data Model Overview

### Tables Needed

| Table              | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `devices`          | Track free tier usage per device fingerprint |
| `redemption_codes` | Store codes with token balances              |
| `purchases`        | Purchase history for receipts and auditing   |
| `generations`      | Track individual image generations           |

### Free Tier Tracking

- Store device fingerprint → usage count + reset timestamp
- Weekly reset based on `reset_at` column
- No Redis needed—simple timestamp check in PostgreSQL

### Token Balance

- Redemption code → remaining tokens
- Decrement on each generation
- Never expires

---

## API Routes Overview

| Route                  | Method | Purpose                        |
| ---------------------- | ------ | ------------------------------ |
| `/api/usage`           | GET    | Check free tier remaining      |
| `/api/generate`        | POST   | Generate image (checks tokens) |
| `/api/redeem`          | POST   | Redeem code, load balance      |
| `/api/checkout`        | POST   | Create Stripe checkout session |
| `/api/webhooks/stripe` | POST   | Handle Stripe webhooks         |

---

## Client-Side Token Management

1. On app load: Check localStorage for redemption code
2. If code exists: Fetch balance from server
3. If no code: Check free tier usage via device fingerprint
4. Display appropriate UI: "X free images" or "X tokens remaining"
5. On purchase success: Save new code to localStorage

---

## Technical Implementation Notes

### Vercel Region Configuration

Configure Vercel functions to EU to match Neon database:

```json
// vercel.json
{
  "regions": ["fra1"]
}
```

### Stripe Webhook Security

- Verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Store Stripe event IDs in database to prevent duplicate processing (idempotency)

### Code Character Set

Exclude visually confusing characters:

```
Excluded: 0, O, 1, I, L
Allowed:  2-9, A-H, J-K, M-N, P-Z (31 characters)
```

Format: `COLOR-XXXX-XXXX` where X is from allowed set.

Checksum: Final character is a check digit (Luhn algorithm or similar).

### Environment Variables

| Variable                 | Purpose                        |
| ------------------------ | ------------------------------ |
| `DATABASE_URL`           | Neon connection string         |
| `STRIPE_SECRET_KEY`      | Stripe API key                 |
| `STRIPE_WEBHOOK_SECRET`  | Webhook signature verification |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js (public) |

---

## Implementation Order (Suggested)

1. **Database setup** - Neon connection, Drizzle schema, migrations
2. **Free tier** - Fingerprint integration, usage tracking
3. **Stripe integration** - Checkout, webhooks, code generation
4. **Token redemption** - Code entry, balance management
5. **PayPal enablement** - Enable in Stripe dashboard
6. **UI updates** - Purchase prompts, balance display

---

_Last updated: January 2025_
