# Monetization Strategy

## Overview

A freemium model with weekly free credits and one-time token pack purchases. Designed for frictionless access—no account or signup required.

## Target Audience

| Segment                   | Behavior                                               | Needs                                 |
| ------------------------- | ------------------------------------------------------ | ------------------------------------- |
| **Kindergarten Teachers** | Bulk generation for classroom activities, themed units | Larger packs, expense receipts        |
| **Parents**               | Sporadic use (rainy days, parties, travel)             | Small affordable packs, no commitment |

## API Model Selection

Two Gemini models are viable, with significant cost differences:

| Model                | Cost/Image | Notes                                     |
| -------------------- | ---------- | ----------------------------------------- |
| **Gemini 2.5 Flash** | $0.039     | Recommended — 1290 tokens @ $30/1M tokens |
| Gemini 2.0 Pro       | $0.134     | Higher quality, but 3.4x more expensive   |

**Recommendation:** Start with Gemini 2.5 Flash. The cost savings enable generous free tiers and healthy margins. Switch to Pro only if quality issues arise.

## VAT Considerations

Digital products sold to EU customers are subject to VAT at the customer's location.

| Region           | VAT Rate | Revenue on $9.99 |
| ---------------- | -------- | ---------------- |
| US (most states) | 0%       | $9.99            |
| Germany          | 19%      | $8.39            |
| France           | 20%      | $8.33            |
| UK               | 20%      | $8.33            |
| Sweden           | 25%      | $7.99            |

**Assumptions for calculations:**

- 40% of customers from VAT regions
- 20% average VAT rate
- VAT-inclusive pricing (same price displayed everywhere)

This reduces effective revenue by ~8% on average.

**Implementation:** Use Stripe Tax for automatic VAT calculation, collection, and remittance.

## Free Tier

**3 images per week** (resets weekly)

### Rationale

- Sufficient for a single coloring session
- Creates natural conversion moments ("I need more for Friday's class")
- Weekly reset encourages return visits
- Cost-effective at $0.51/user/month (with Flash)

### Free Tier Sensitivity

Impact of different generosity levels (Gemini 2.5 Flash):

| Imgs/Week | Cost/User/Mo | Break-even Conv | Profit @ 15% conv (1k DAU) |
| --------- | ------------ | --------------- | -------------------------- |
| 1         | $0.17        | 2.0%            | $1,090/mo                  |
| 2         | $0.34        | 4.0%            | $921/mo                    |
| **3**     | **$0.51**    | **6.0%**        | **$752/mo**                |
| 5         | $0.84        | 10.1%           | $414/mo                    |
| 7         | $1.18        | 14.1%           | $77/mo                     |

With Flash pricing, even 5/week is sustainable. Consider increasing to 5/week if conversion rates exceed 15%.

### User Experience

- Track via device fingerprint + localStorage (no account needed)
- Display remaining credits: "2 of 3 free images remaining this week"
- Show reset timing: "Resets in 3 days"

## Paid Tier: Token Packs

One-time purchases, no subscription, tokens never expire.

### Pricing Strategy

Prices are fixed; image counts are calculated dynamically based on:

- Target margin per tier (volume discount incentive)
- API cost
- VAT-adjusted effective revenue

**Target margins:**

- Starter: 60% (small pack, higher margin)
- Family: 55% (mid-tier)
- Classroom: 50% (volume discount for teachers)

### Pack Comparison by Model

| Pack          | Price  | Target Margin | Flash (47/107/239 imgs) | Pro (13/31/69 imgs) |
| ------------- | ------ | ------------- | ----------------------- | ------------------- |
| **Starter**   | $4.99  | 60%           | 47 images               | 13 images           |
| **Family**    | $9.99  | 55%           | 107 images              | 31 images           |
| **Classroom** | $19.99 | 50%           | 239 images              | 69 images           |

With Flash, you can offer **3.5x more images** at the same margins—a compelling value proposition.

### Per-Image Pricing (Flash)

| Pack      | Price/Image | Effective (after VAT) |
| --------- | ----------- | --------------------- |
| Starter   | $0.11       | $0.10                 |
| Family    | $0.09       | $0.09                 |
| Classroom | $0.08       | $0.08                 |

### Purchase Flow (No Account)

1. User clicks "Get More Images"
2. Selects pack → Stripe checkout
3. Receives unique redemption code (e.g., `COLOR-A7X9-B3M2`)
4. Code stored locally + server-side for recovery
5. User can re-enter code on any device to restore balance

### Why No Accounts

- Zero friction for impulse purchases
- Parents don't want another login
- Teachers can share codes with classroom aides if needed

## Economics (Gemini 2.5 Flash)

### Key Metrics

| Metric                    | Value            |
| ------------------------- | ---------------- |
| API cost                  | $0.039/image     |
| Free tier (3/week)        | $0.51/user/month |
| Weighted ARPU (after VAT) | $8.39            |
| Break-even conversion     | **6.0%**         |

### Profit Scenarios (per 1,000 DAU)

| Conversion | Paying Users | Revenue | Free Cost | Net Profit  |
| ---------- | ------------ | ------- | --------- | ----------- |
| 10%        | 100          | $839    | $507      | **+$332**   |
| 15%        | 150          | $1,259  | $507      | **+$752**   |
| 18%        | 180          | $1,510  | $507      | **+$1,004** |
| 20%        | 200          | $1,678  | $507      | **+$1,172** |

### Profit at Scale

| DAU    | 10% Conv | 15% Conv | 18% Conv | 20% Conv |
| ------ | -------- | -------- | -------- | -------- |
| 1,000  | +$332    | +$752    | +$1,004  | +$1,172  |
| 5,000  | +$1,662  | +$3,760  | +$5,019  | +$5,858  |
| 10,000 | +$3,325  | +$7,520  | +$10,037 | +$11,715 |

## Alternative Approach: Lifetime Credits

If weekly free tier proves too costly (e.g., if forced to use Pro model), consider **lifetime credits**:

| Aspect            | Weekly (3/week)             | Lifetime (5 total)          |
| ----------------- | --------------------------- | --------------------------- |
| Cost/user/month   | $0.51 (Flash) / $1.74 (Pro) | ~$0.20 / ~$0.67 (amortized) |
| Break-even conv   | 6% (Flash) / 21% (Pro)      | 2.4% / 8%                   |
| User perception   | Generous, ongoing           | Limited trial               |
| Return motivation | High (weekly reset)         | Lower                       |

Lifetime credits serve as a fallback if using a more expensive model.

## Calculator Script

A TypeScript calculator is available for modeling scenarios:

```sh
pnpx tsx scripts/monetization-calc.ts
```

**Configurable parameters:**

- `apiCostPerImage` — switch between models
- `freeTier.imagesPerWeek` — adjust generosity
- `tokenPacks[].targetMargin` — lock margins
- `tokenPacks[].price` — adjust price points
- `vat.vatCustomerShare` — regional customer mix
- `vat.averageVatRate` — average VAT rate

## Future Optimizations

### Cost Reduction

- Batch API requests during off-peak hours
- Cache popular prompts (e.g., "butterfly coloring page")
- Lower resolution previews before full generation

### Revenue Growth

- Seasonal bundles (Halloween pack, Christmas pack)
- Bulk pricing for schools (custom quotes)
- Referral program (give 3, get 3 free images)

---

_Last updated: January 2025_
