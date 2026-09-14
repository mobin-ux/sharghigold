/**
 * Labels for the `/installment` screen.
 *
 * Browser-safe and free of arithmetic on money: every amount arrives from
 * `server/policy/installment-calculator.ts` already priced, and this module
 * only decides how it reads.
 */
import { INSTALLMENT } from '@/config/commerce-terms';

import { persianCount } from './product-view';

/**
 * A priced quote, as the calculator receives it from the server.
 *
 * Money crosses to the browser as strings of whole rials.
 */
export interface CalculatorQuote {
  /** Digits as the URL carried them, so the field shows what was typed. */
  readonly typed: string;
  /** The amount actually priced, in toman. Differs from `typed` only with `error`. */
  readonly amountToman: string;
  readonly months: number;
  /** Why the priced amount is not the typed one. Null when they agree. */
  readonly error: string | null;
  readonly cashRials: string;
  readonly depositRials: string;
  readonly financedRials: string;
  /** What the term adds on top of the cash price. */
  readonly surchargeRials: string;
  /** The largest instalment rounded up to a toman — the figure quoted. */
  readonly monthlyRials: string;
  readonly totalRials: string;
  /** Each instalment, rounded up to a toman as `monthlyRials` is. */
  readonly instalmentRials: readonly string[];
}

/**
 * The amounts under the field, in toman.
 *
 * Suggestions rather than terms — nothing is priced from them until the
 * server reads them back out of the URL — so they live with the labels.
 */
export const QUICK_AMOUNTS_TOMAN: readonly string[] = ['30000000', '60000000', '120000000'];

/** «۶۰ میلیون», for a whole number of millions of toman. */
export function millionsLabel(toman: string): string {
  return `${persianCount(Number(BigInt(toman) / 1_000_000n))} میلیون`;
}

/**
 * What a term adds to the balance, under its month count: «کارمزد ۲۴٪».
 *
 * The surcharge is a monthly rate on the financed balance, so the share a term
 * adds is that rate times its months. Basis points stay integers throughout.
 */
export function termSurchargeLabel(months: number): string {
  const basisPoints = INSTALLMENT.monthlySurchargeBasisPoints * months;
  return `کارمزد ${persianCount(basisPoints / 100)}٪`;
}

/** The monthly rate, for «کارمزد اقساط (۲٪ ماهانه)». */
export const MONTHLY_SURCHARGE_LABEL = `${persianCount(INSTALLMENT.monthlySurchargeBasisPoints / 100)}٪ ماهانه`;

/** «۱۲ قسط». */
export function instalmentCountLabel(months: number): string {
  return `${persianCount(months)} قسط`;
}

/**
 * A row of the schedule: «ماه ۳ از ۱۲».
 *
 * Counted within the term rather than dated. No due date exists until an
 * order is placed and delivered, and a month name here would be a promise
 * about a day nobody has set.
 */
export function instalmentDueLabel(index: number, months: number): string {
  return `ماه ${persianCount(index + 1)} از ${persianCount(months)}`;
}
