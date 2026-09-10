/**
 * Where a product's price comes from.
 *
 * This module is the only thing on the storefront that turns a weight and a
 * gold rate into money, and it does it with `@sharghigold/money` — whole rials
 * and whole milligrams held as `bigint`, no floating point anywhere. The
 * design canvas computes the same figure in the browser with `RATE * WEIGHT`
 * and a chain of `* 0.18`; that is fine for a drawing and wrong for a shop.
 *
 * It also decides how long the figure is honoured for. Gold moves during a
 * session, so a quote carries an expiry and the page counts down to it. When
 * the countdown runs out the page asks for a new quote rather than keeping a
 * stale one on screen.
 *
 * Server-only. `now` is a parameter rather than a call to the clock so the
 * arithmetic and the expiry are both testable, and so one render cannot
 * observe two different instants.
 */
import { priceQuoteSchema, type PriceQuote, type ProductDetail } from '@sharghigold/contracts';
import {
  allocateRials,
  milligrams,
  pricePerGramForKarat,
  quoteGoldPrice,
  rials,
  RIALS_PER_TOMAN,
  roundTotalToStep,
  type Rials,
} from '@sharghigold/money';

import { getGoldRate } from '@/lib/gold-price';
import { INSTALLMENT_TERMS, PRICE_LOCK_SECONDS } from '@/server/policy/shop-policy';

/** Thrown when a quote cannot be produced in the shape the contract promises. */
export class PricingContractError extends Error {
  constructor(detail: string) {
    super(`Price quote did not match the contract: ${detail}`);
    this.name = 'PricingContractError';
  }
}

/**
 * Split a total into `months` equal instalments and quote the largest.
 *
 * `allocateRials` distributes the remainder a rial at a time rather than
 * rounding each instalment on its own, so the instalments always add back to
 * the total exactly. The largest is what gets quoted, and it is rounded *up*
 * to a whole toman — the unit the figure is displayed in.
 *
 * Both choices point the same way: a customer is never asked for more than the
 * number they were shown. Rounding the quote down would leave the last
 * instalment a few toman short of the price, which is the shop's rounding
 * error to absorb, not the customer's to discover.
 */
function monthlyInstalment(total: Rials, months: number): Rials {
  const parts = allocateRials(
    total,
    Array.from({ length: months }, () => 1n),
  );

  const largest = parts.reduce((most, part) => (part > most ? part : most), rials(0n));

  return roundTotalToStep(largest, RIALS_PER_TOMAN, 'ceil');
}

/**
 * The authoritative price for one product, valid until it expires.
 *
 * Recomputed from the product's own weight and rates every time. Nothing here
 * reads a price from anywhere, which is the point: there is no stored figure
 * to go stale and no client-supplied figure to be trusted.
 */
export function quoteProduct(product: ProductDetail, now: Date): PriceQuote {
  const rate = getGoldRate();

  // The feed publishes 18-carat; a 21- or 22-carat piece is priced by exact
  // carat ratio rather than by a second rate that could drift from the first.
  const pricePerGram = pricePerGramForKarat(rate.pricePerGram18k, rate.quotedKarat, product.karat);

  const breakdown = quoteGoldPrice({
    pricePerGram,
    weight: milligrams(BigInt(product.weightMilligrams)),
    makingFeeBasisPoints: product.makingFeeBasisPoints,
    profitBasisPoints: product.profitBasisPoints,
    vatBasisPoints: product.vatBasisPoints,
  });

  const expiresAt = new Date(now.getTime() + PRICE_LOCK_SECONDS * 1_000);

  const candidate = {
    rate: {
      pricePerGramRials: pricePerGram.toString(),
      quotedKarat: product.karat,
      observedAt: rate.observedAt,
      isLive: rate.isLive,
    },
    lines: [
      { kind: 'gold-value', amountRials: breakdown.goldValue.toString(), basisPoints: null },
      {
        kind: 'making-fee',
        amountRials: breakdown.makingFee.toString(),
        basisPoints: product.makingFeeBasisPoints,
      },
      {
        kind: 'profit',
        amountRials: breakdown.profit.toString(),
        basisPoints: product.profitBasisPoints,
      },
      {
        kind: 'vat',
        amountRials: breakdown.vat.toString(),
        basisPoints: product.vatBasisPoints,
      },
    ],
    totalRials: breakdown.total.toString(),
    quotedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    secondsRemaining: PRICE_LOCK_SECONDS,
    plans: product.installmentEligible
      ? INSTALLMENT_TERMS.map((months) => ({
          months,
          monthlyRials: monthlyInstalment(breakdown.total, months).toString(),
        }))
      : [],
  };

  // The gateway proves it honours its own contract. A quote that fails here is
  // a bug in this file, and it should stop the page rather than reach a
  // customer as a total nobody checked.
  const parsed = priceQuoteSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new PricingContractError(
      parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
    );
  }

  return parsed.data;
}
