import Stripe from "stripe"
import { STRIPE_SECRET_KEY } from "$env/static/private"

export const stripe = new Stripe(STRIPE_SECRET_KEY)

const isLiveMode = STRIPE_SECRET_KEY.startsWith("sk_live_")

const PRICE_IDS = {
  sandbox: {
    starter: "price_1SnGwgIXLqh6j1t4tLY5JlGo",
    family: "price_1SnGwhIXLqh6j1t4CgIZEUtl",
    classroom: "price_1SnGwiIXLqh6j1t4PP5CJTnD",
  },
  live: {
    starter: "price_1SnI7HRDAnklIKxCqbvsaBcw",
    family: "price_1SnI7IRDAnklIKxCOCRiTI1Q",
    classroom: "price_1SnI7KRDAnklIKxC0KOlyQ7c",
  },
} as const

const priceIds = isLiveMode ? PRICE_IDS.live : PRICE_IDS.sandbox

/**
 * Token pack definitions with Stripe price IDs.
 */
export const TOKEN_PACKS = {
  starter: {
    name: "Starter Pack",
    description: "50 coloring page images - Perfect for a rainy day",
    tokens: 50,
    amountCents: 499,
    priceId: priceIds.starter,
  },
  family: {
    name: "Family Pack",
    description: "110 coloring page images - Great for parties & holidays",
    tokens: 110,
    amountCents: 999,
    priceId: priceIds.family,
  },
  classroom: {
    name: "Classroom Pack",
    description: "240 coloring page images - Best value for teachers",
    tokens: 240,
    amountCents: 1999,
    priceId: priceIds.classroom,
  },
} as const

export type PackType = keyof typeof TOKEN_PACKS

/**
 * Validate that a string is a valid pack type.
 */
export function isValidPackType(packType: string): packType is PackType {
  return packType in TOKEN_PACKS
}
