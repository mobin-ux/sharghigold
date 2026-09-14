/**
 * The `/installment` calculator: what the URL asks for, and what it costs.
 *
 * The calculator's inputs live in the address (`?amount=…&months=…`) and the
 * arithmetic lives here, on the server, through the same `priceInstallment`
 * checkout charges with. The browser only chooses which address to load, so a
 * monthly figure on this page is the figure checkout will ask for.
 *
 * Reading the URL never throws. A hand-edited amount prices the nearest amount
 * the calculator accepts and says so, rather than failing the page: a
 * calculator that 500s on a crafted link is one anybody can take down.
 */
import { INSTALLMENT_QUOTE_MAX_TOMAN, INSTALLMENT_QUOTE_MIN_TOMAN } from '@sharghigold/contracts';
import {
  formatToman,
  rials,
  RIALS_PER_TOMAN,
  roundTotalToStep,
  subtractRials,
  toLatinDigits,
} from '@sharghigold/money';

import type { CalculatorQuote } from '@/lib/installment-view';

import { priceInstallment } from './installments';
import { INSTALLMENT } from './shop-policy';

/** What the calculator prices when the URL names no amount. */
export const DEFAULT_QUOTE_TOMAN = 60_000_000n;

/** The term chosen when the URL names none, or one the shop does not offer. */
export const DEFAULT_QUOTE_MONTHS: number = INSTALLMENT.terms[1] ?? INSTALLMENT.terms[0];

type Raw = string | readonly string[] | undefined;

function first(raw: Raw): string | undefined {
  return typeof raw === 'string' ? raw : raw?.[0];
}

interface AmountReading {
  readonly typed: string;
  readonly toman: bigint;
  readonly error: string | null;
}

/**
 * The amount to price.
 *
 * Persian digits and thousands separators are accepted, because that is what
 * a customer pasting «۶۰٬۰۰۰٬۰۰۰» produces. Anything else is bounded by the
 * contract's quote range, not by the field.
 */
export function readQuoteAmount(raw: Raw): AmountReading {
  const text = toLatinDigits(first(raw) ?? '').replace(/[,٬\s]/g, '');

  if (text === '') {
    return { typed: DEFAULT_QUOTE_TOMAN.toString(), toman: DEFAULT_QUOTE_TOMAN, error: null };
  }

  // Thirteen digits is the contract's ceiling; a longer string is refused
  // before `BigInt` is asked to parse a megabyte.
  if (!/^\d{1,13}$/.test(text)) {
    return {
      typed: '',
      toman: DEFAULT_QUOTE_TOMAN,
      error: 'مبلغ را فقط با رقم وارد کنید.',
    };
  }

  const toman = BigInt(text);
  const typed = toman.toString();

  if (toman < INSTALLMENT_QUOTE_MIN_TOMAN) {
    return {
      typed,
      toman: INSTALLMENT_QUOTE_MIN_TOMAN,
      error: `حداقل مبلغ خرید اقساطی ${tomanLabel(INSTALLMENT_QUOTE_MIN_TOMAN)} است.`,
    };
  }

  if (toman > INSTALLMENT_QUOTE_MAX_TOMAN) {
    return {
      typed,
      toman: INSTALLMENT_QUOTE_MAX_TOMAN,
      error: `بیشترین مبلغ قابل محاسبه ${tomanLabel(INSTALLMENT_QUOTE_MAX_TOMAN)} است.`,
    };
  }

  return { typed, toman, error: null };
}

/** A term the shop offers, and only one it offers. */
export function readQuoteMonths(raw: Raw): number {
  const requested = Number(first(raw));
  const terms: readonly number[] = INSTALLMENT.terms;

  return terms.includes(requested) ? requested : DEFAULT_QUOTE_MONTHS;
}

/** Price what the URL asks for. */
export function quoteFromQuery(amount: Raw, months: Raw): CalculatorQuote {
  const reading = readQuoteAmount(amount);
  const term = readQuoteMonths(months);

  const cash = rials(reading.toman * RIALS_PER_TOMAN);
  const priced = priceInstallment(cash, term);

  return {
    typed: reading.typed,
    amountToman: reading.toman.toString(),
    months: term,
    error: reading.error,
    cashRials: cash.toString(),
    depositRials: priced.deposit.toString(),
    financedRials: priced.financed.toString(),
    surchargeRials: subtractRials(priced.total, cash).toString(),
    monthlyRials: priced.monthly.toString(),
    totalRials: priced.total.toString(),
    instalmentRials: priced.instalments.map((part) =>
      roundTotalToStep(part, RIALS_PER_TOMAN, 'ceil').toString(),
    ),
  };
}

function tomanLabel(toman: bigint): string {
  return formatToman(rials(toman * RIALS_PER_TOMAN));
}
