# Payment Provider Options

Comparison of realistic options for one-time token pack purchases ($5-$20 range).

## Overview

| Provider | Fee | MoR | Tax Handling | PayPal Support |
|----------|-----|-----|--------------|----------------|
| **Stripe** | 2.9% + $0.30 | No | DIY | Separate integration |
| **LemonSqueezy** | 5% + $0.50 | Yes | Included | Built-in |
| **PayPal** | 3.49% + $0.49 | No | DIY | Native |

MoR = Merchant of Record (handles VAT/sales tax globally on your behalf)

## Fee Impact on Token Packs

| Pack | Price | Stripe | LemonSqueezy | PayPal |
|------|-------|--------|--------------|--------|
| Starter | $4.99 | $0.44 (8.9%) | $0.75 (15.0%) | $0.66 (13.3%) |
| Family | $9.99 | $0.59 (5.9%) | $1.00 (10.0%) | $0.84 (8.4%) |
| Classroom | $19.99 | $0.88 (4.4%) | $1.50 (7.5%) | $1.19 (5.9%) |

## Payment Methods

| Method | Stripe | LemonSqueezy | PayPal |
|--------|--------|--------------|--------|
| Credit/Debit Cards | Yes | Yes | Yes |
| Apple Pay | Yes | Yes | No |
| Google Pay | Yes | Yes | No |
| PayPal | No* | Yes | Yes |
| Bank/ACH | Yes | Yes | Yes |
| PayPal Balance | No | Yes | Yes |
| Venmo (US) | No | No | Yes |

*Stripe can add PayPal but requires separate integration

## Stripe

**Best for:** Lowest fees, maximum control

- Industry standard, excellent documentation
- SvelteKit integration straightforward
- You handle tax compliance (fine for US-only, complex for global)
- Stripe Checkout provides hosted payment page
- Would need separate PayPal integration for full coverage

## LemonSqueezy

**Best for:** Simplicity, global sales, payment flexibility

- Acquired by Stripe (2024) — stable future
- 21+ payment methods including PayPal, Apple Pay, Google Pay
- Handles global VAT/sales tax automatically
- Nice hosted checkout pages out of the box
- Higher fees hurt on small $4.99 purchases (15% lost)

## PayPal

**Best for:** Users who prefer PayPal ecosystem

- Many users already logged in — low friction
- Supports bank accounts without cards
- Venmo integration (US)
- Checkout feels dated compared to modern alternatives
- High fixed fee ($0.49) hurts small purchases
- Tax handling is DIY

## Recommendation

| Approach | Pros | Cons |
|----------|------|------|
| **LemonSqueezy only** | Single integration, all payment methods, tax handled | Highest fees (15% on $4.99 pack) |
| **Stripe only** | Lowest fees, clean UX | No PayPal, tax DIY |
| **Stripe + PayPal** | Low fees + PayPal coverage | Two integrations to maintain |

**For MVP:** LemonSqueezy offers the fastest path to accepting payments with broadest coverage. Fees are high but simplicity has value.

**For optimization:** Stripe + PayPal gives better margins once volume justifies the extra integration work.
