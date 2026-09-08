'use client';

/**
 * How many items are in the basket.
 *
 * PLACEHOLDER, and deliberately returns 0.
 *
 * The basket service does not exist yet. The design canvas draws the bubble
 * with «۲» in it, but that figure is illustrative — the same status as the
 * prices on its product cards, which this storefront computes rather than
 * copies. Hard-coding a 2 here would put a number on a real storefront that
 * tells a customer they have two items they do not have, which is a worse
 * outcome than the bubble being absent until there is something to count.
 *
 * This module exists so the call site is already correct: `CartBadge` asks for
 * the count through a hook, and when `GET /api/v1/cart` is real only this file
 * changes. Everything that renders the bubble — the header and the tab bar —
 * stays as it is.
 */
export function useCartCount(): number {
  return 0;
}
