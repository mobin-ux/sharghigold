/**
 * A price the server computed, and the window it is honoured for.
 *
 * The design draws a five-minute countdown beside the total: the rate a
 * customer sees is held for that long, then re-quoted. That is a real
 * mechanism, not decoration — gold moves during a session, and a shop that
 * lets a customer check out against a rate from twenty minutes ago is losing
 * the difference on every order.
 *
 * So a quote is not a number. It is a total, the inputs it came from, and an
 * expiry. The client counts down to `expiresAt` and asks for a fresh quote
 * when it passes. When an order is placed the server quotes again from the
 * weight and the live rate and charges *that*; the figure the browser is
 * holding is a display echo, never an amount to charge (rules 5, 15 and 17).
 *
 * Every amount crosses the wire as a string of whole rials. `JSON.parse` turns
 * a number into a double, and a double cannot hold a rial total exactly.
 */
import { z } from 'zod';

import { basisPointsSchema, karatSchema, positiveRialsStringSchema } from './primitives.js';

/* -------------------------------------------------------------------------- */
/* The gold rate a quote was struck at                                        */
/* -------------------------------------------------------------------------- */

export const goldRateSnapshotSchema = z.object({
  /** One gram at the quoted purity, in whole rials. */
  pricePerGramRials: positiveRialsStringSchema,
  quotedKarat: karatSchema,
  /** When the feed published this figure. */
  observedAt: z.iso.datetime(),
  /**
   * False while the figure is a placeholder rather than a market reading.
   *
   * Carried explicitly so a page cannot show a stale number as if it were
   * live. Anything that renders a price is expected to look at this.
   */
  isLive: z.boolean(),
});

export type GoldRateSnapshot = z.output<typeof goldRateSnapshotSchema>;

/* -------------------------------------------------------------------------- */
/* The breakdown                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The four lines of an Iranian retail gold price, in the order they compose.
 *
 * The detail most often got wrong is the last one: VAT applies to the making
 * fee and the profit only, never to the value of the metal. Naming the lines
 * rather than sending free text is what lets the storefront say so, and keeps
 * a pricing service from choosing the words on the invoice.
 */
export const priceLineKindSchema = z.enum(['gold-value', 'making-fee', 'profit', 'vat']);

export type PriceLineKind = z.output<typeof priceLineKindSchema>;

export const priceLineSchema = z.object({
  kind: priceLineKindSchema,
  amountRials: positiveRialsStringSchema,
  /**
   * The rate this line was struck at, so the page can show «اجرت ساخت (۱۸٪)»
   * without being told the label. Null for the gold value, which is a weight
   * times a rate rather than a percentage of anything.
   */
  basisPoints: basisPointsSchema.nullable(),
});

export type PriceLine = z.output<typeof priceLineSchema>;

/* -------------------------------------------------------------------------- */
/* Installments                                                               */
/* -------------------------------------------------------------------------- */

/**
 * One instalment option: a term, and what a month costs on it.
 *
 * The monthly figure is computed on the server and rounded there. Dividing a
 * total by a term in the browser is float division on money, and it is how the
 * sum of twelve instalments ends up not being the price.
 */
export const installmentPlanSchema = z.object({
  months: z.int().min(1).max(60),
  monthlyRials: positiveRialsStringSchema,
});

export type InstallmentPlan = z.output<typeof installmentPlanSchema>;

/* -------------------------------------------------------------------------- */
/* The quote                                                                  */
/* -------------------------------------------------------------------------- */

export const priceQuoteSchema = z
  .object({
    rate: goldRateSnapshotSchema,
    /** Exactly the four lines, in composition order. */
    lines: z.array(priceLineSchema).length(4),
    totalRials: positiveRialsStringSchema,
    quotedAt: z.iso.datetime(),
    /** After this instant the total is void and must be recomputed. */
    expiresAt: z.iso.datetime(),
    /**
     * Whole seconds left at the moment the server rendered.
     *
     * Sent alongside `expiresAt` so the first client render matches the server
     * render exactly. Deriving it in the browser from `Date.now()` produces a
     * different string on the first paint than the one the server sent, which
     * is a hydration mismatch on the most important number on the page.
     */
    secondsRemaining: z.int().min(0),
    plans: z.array(installmentPlanSchema).max(6),
  })
  .refine((quote) => Date.parse(quote.expiresAt) > Date.parse(quote.quotedAt), {
    message: 'مهلت قیمت باید پس از زمان صدور باشد',
    path: ['expiresAt'],
  });

export type PriceQuote = z.output<typeof priceQuoteSchema>;
