import { rials, type Rials } from '@sharghigold/money';

/**
 * The gold rate the storefront prices against.
 *
 * PLACEHOLDER. There is no market feed yet. This module exists so that every
 * caller already asks for the rate through one function with a timestamp
 * attached, rather than reaching for a constant — when the feed lands, the
 * shape of the call site does not change.
 *
 * Two things it refuses to do, deliberately:
 *
 *   - It does not pretend to be live. `asOf` is the fixed date this figure was
 *     taken, and `isLive` is false. Anything that displays a price is expected
 *     to look at those, because showing a stale gold rate as if it were current
 *     is how a shop ends up honouring yesterday's price on today's metal.
 *   - It does not read the rate from the client. The authoritative rate comes
 *     from the server, is snapshotted per quote, and is what an order is
 *     written against. A rate that arrived in a request body is a number a
 *     customer chose.
 */
export interface GoldRate {
  /** Price of one gram of 18-carat gold, in whole rials. */
  readonly pricePerGram18k: Rials;
  /** Karat this rate is quoted in. Iranian feeds publish 18. */
  readonly quotedKarat: 18;
  /** When this figure was taken, for display. Persian, already formatted. */
  readonly asOf: string;
  /**
   * The same instant as `asOf`, as an ISO 8601 timestamp.
   *
   * Kept alongside rather than instead of it because the two have different
   * jobs: `asOf` is what a customer reads, `observedAt` is what a quote is
   * stamped with and what a staleness check compares. Deriving one from the
   * other at every call site is how a Gregorian date ends up on a Persian
   * page.
   */
  readonly observedAt: string;
  /** False until a real feed backs this. Never assume it is true. */
  readonly isLive: boolean;
}

/**
 * ۱۰٬۴۸۰٬۰۰۰ تومان per gram — the figure the design canvas was drawn against,
 * expressed in rials. Kept so the rendered page can be compared against the
 * design, and so the money package's reference test case and this page agree.
 */
const PLACEHOLDER_RATE: GoldRate = {
  pricePerGram18k: rials(104_800_000n),
  quotedKarat: 18,
  asOf: '۱۲ مرداد ۱۴۰۵',
  observedAt: '2026-08-03T09:00:00.000Z',
  isLive: false,
};

export function getGoldRate(): GoldRate {
  return PLACEHOLDER_RATE;
}
