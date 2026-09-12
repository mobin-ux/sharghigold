/**
 * Turning a product and its quote into the strings the page renders.
 *
 * The contract deliberately carries numbers and keys — rials as digit strings,
 * a colour name, a star count, an ISO timestamp — and none of that is what a
 * customer reads. This module is where locale is applied, and it is the only
 * place: a component that formatted its own price would be a second
 * implementation of the rounding, the grouping and the numerals.
 *
 * Every money value goes through `@sharghigold/money`. Nothing here divides,
 * multiplies or adds an amount — the arithmetic happened on the server, and a
 * formatter that does sums is a formatter that can disagree with the total.
 */
import type { GoldColour, PriceLine, ReviewAspect } from '@sharghigold/contracts';
import {
  formatBasisPointsAsPercent,
  formatGrams,
  formatToman,
  milligrams,
  PERSIAN_DECIMAL_SEPARATOR,
  rials,
  toPersianDigits,
} from '@sharghigold/money';

/* -------------------------------------------------------------------------- */
/* Numbers                                                                    */
/* -------------------------------------------------------------------------- */

/** Grouped Persian numerals, no unit. The caller renders «تومان» itself. */
export function toman(amountRials: string): string {
  return formatToman(rials(BigInt(amountRials)), { withUnit: false });
}

/** A plain count — «۱۲۴», «۳۱۰» — in Persian numerals. */
export function persianCount(value: number): string {
  return toPersianDigits(String(value));
}

/** «۲٫۸۰ گرم», to the two decimals the trade quotes. */
export function weightLabel(weightMilligrams: string, withUnit = true): string {
  return formatGrams(milligrams(BigInt(weightMilligrams)), { withUnit, fractionDigits: 2 });
}

/**
 * How long until an attempt may be retried: «۳۰ ثانیه» or «۲ دقیقه».
 *
 * Written once rather than in each action that rate-limits. Two copies existed
 * — in the sign-in actions and in the wallet top-up — and both interpolated the
 * count as a Latin numeral into a Persian sentence, so a customer who asked
 * for a second code was told to wait «29 ثانیه».
 *
 * Rounded up, and never below one: telling somebody to wait zero seconds and
 * then refusing them again is worse than telling them to wait one.
 */
export function retryLabel(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);

  return minutes > 1
    ? `${persianCount(minutes)} دقیقه`
    : `${persianCount(Math.max(1, Math.ceil(seconds)))} ثانیه`;
}

/**
 * The remaining lock as «۰۴:۳۷».
 *
 * Padded on both halves so the width never changes as it counts down; the
 * figure sits next to a price and a jumping layout beside a price reads as the
 * price moving.
 */
export function lockLabel(secondsRemaining: number): string {
  const clamped = Math.max(0, secondsRemaining);

  return `${twoDigits(Math.floor(clamped / 60))}:${twoDigits(clamped % 60)}`;
}

function twoDigits(value: number): string {
  return toPersianDigits(String(value).padStart(2, '0'));
}

/**
 * A decimal that arrived as a number — «4.3», «54.4» — as Persian text.
 *
 * The contract sends Latin digits and a full stop, because that is a number.
 * This is the one place it becomes something to read. The separator is U+066B
 * and not a full stop: a Persian reader parses «۴.۳» as four thousand three
 * hundred.
 */
export function persianDecimal(value: string): string {
  return toPersianDigits(value).replace('.', PERSIAN_DECIMAL_SEPARATOR);
}

/**
 * A rating bucket as a whole percentage of the total.
 *
 * Integer arithmetic, rounded once. Used for a bar's width, so it also has to
 * be a value CSS accepts.
 */
export function ratingPercent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count * 100) / total);
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

const PRICE_LINE_NAMES: Record<PriceLine['kind'], string> = {
  'gold-value': 'ارزش طلا',
  'making-fee': 'اجرت ساخت',
  profit: 'سود فروشنده',
  vat: 'مالیات بر ارزش افزوده',
};

/**
 * How a breakdown line is described: «اجرت ساخت (۱۸٪)».
 *
 * The rate is part of the label because the point of the breakdown is that a
 * customer can check it. A line that says only «اجرت ساخت» is a number to
 * accept; one that names the rate is a number to verify.
 */
export function priceLineLabel(line: PriceLine, weightMilligrams: string): string {
  const name = PRICE_LINE_NAMES[line.kind];

  if (line.kind === 'gold-value') {
    return `${name} (${weightLabel(weightMilligrams)} × نرخ روز)`;
  }

  return line.basisPoints === null
    ? name
    : `${name} (${formatBasisPointsAsPercent(line.basisPoints)})`;
}

export const COLOUR_SWATCH: Record<GoldColour, string> = {
  yellow: 'var(--gold-400)',
  rose: '#d9a38c',
  white: '#dcdce0',
};

export const ASPECT_LABEL: Record<ReviewAspect, string> = {
  'build-quality': 'کیفیت ساخت',
  'photo-match': 'تطابق با تصویر',
  value: 'ارزش خرید',
};

/** The word beside the stars while a review is being written. */
export const RATING_WORDS = ['امتیاز بدهید', 'ضعیف', 'معمولی', 'خوب', 'خیلی خوب', 'عالی'] as const;

/* -------------------------------------------------------------------------- */
/* Time                                                                       */
/* -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;

/**
 * «۲ هفته پیش», «۳ ماه پیش», «امروز».
 *
 * Rendered on the server from an ISO instant rather than stored as a phrase,
 * so a review does not stay «۲ هفته پیش» for the rest of its life. Coarse on
 * purpose: the exact hour a stranger left a review is noise, and the units
 * stop at years because «۱۴ ماه پیش» is not how anyone reads a date.
 */
export function relativeTime(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - Date.parse(iso)) / DAY_MS);

  if (days <= 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return `${persianCount(days)} روز پیش`;
  if (days < 30) return `${persianCount(Math.floor(days / 7))} هفته پیش`;
  if (days < 365) return `${persianCount(Math.floor(days / 30))} ماه پیش`;

  return `${persianCount(Math.floor(days / 365))} سال پیش`;
}
