/**
 * Presentation helpers for money and weight.
 *
 * The design system requires Persian (Eastern Arabic) numerals throughout the
 * UI, grouped with the Persian thousands separator U+066C and suffixed تومان.
 * Latin digits are for data and API contexts only.
 *
 * Formatting lives here, next to the arithmetic, so there is exactly one
 * implementation rather than a per-component reinvention.
 */
import { MoneyError, type Rials } from './rial.js';
import { divideRounded, type RoundingMode } from './rounding.js';
import { milligramsToGramString, type Milligrams } from './weight.js';

/** U+06F0..U+06F9 — Persian digits. */
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** U+066C — Persian thousands separator. */
export const PERSIAN_THOUSANDS_SEPARATOR = '٬';

/** U+066B — Persian decimal separator. */
export const PERSIAN_DECIMAL_SEPARATOR = '٫';

export const RIALS_PER_TOMAN = 10n;

/** Replace ASCII digits with Persian digits, leaving everything else intact. */
export function toPersianDigits(value: string): string {
  let out = '';
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code !== undefined && code >= 0x30 && code <= 0x39) {
      out += PERSIAN_DIGITS[code - 0x30];
    } else {
      out += character;
    }
  }
  return out;
}

/** Inverse of {@link toPersianDigits}; useful when parsing user input. */
export function toLatinDigits(value: string): string {
  let out = '';
  for (const character of value) {
    const code = character.codePointAt(0);
    // Persian U+06F0-U+06F9 and Arabic-Indic U+0660-U+0669.
    if (code !== undefined && code >= 0x06f0 && code <= 0x06f9) {
      out += String.fromCharCode(0x30 + (code - 0x06f0));
    } else if (code !== undefined && code >= 0x0660 && code <= 0x0669) {
      out += String.fromCharCode(0x30 + (code - 0x0660));
    } else {
      out += character;
    }
  }
  return out;
}

/** Group an integer string into three-digit blocks using `separator`. */
export function groupThousands(digits: string, separator: string): string {
  const negative = digits.startsWith('-');
  const body = negative ? digits.slice(1) : digits;

  let grouped = '';
  for (let index = 0; index < body.length; index += 1) {
    if (index > 0 && (body.length - index) % 3 === 0) grouped += separator;
    grouped += body[index];
  }
  return negative ? `-${grouped}` : grouped;
}

/**
 * Convert rials to toman.
 *
 * Rial is the settlement unit; toman is what the customer reads. Ten rials make
 * one toman, so the conversion can leave a remainder. The rounding mode is
 * required rather than defaulted at call sites that could lose value, but a
 * remainder is normally impossible because gold prices are quoted in whole
 * toman.
 */
export function rialsToToman(amount: Rials, mode: RoundingMode = 'half-up'): bigint {
  return divideRounded(amount, RIALS_PER_TOMAN, mode);
}

/** Convert rials to toman, refusing to silently discard a remainder. */
export function rialsToTomanExact(amount: Rials): bigint {
  if (amount % RIALS_PER_TOMAN !== 0n) {
    throw new MoneyError(
      `${amount.toString()} rials is not a whole number of toman. ` +
        'Use rialsToToman with an explicit rounding mode if truncation is intended.',
    );
  }
  return amount / RIALS_PER_TOMAN;
}

export interface TomanFormatOptions {
  /** Append the تومان unit. Defaults to true. */
  readonly withUnit?: boolean;
  /** Render Persian numerals. Defaults to true; set false for data contexts. */
  readonly persianDigits?: boolean;
  readonly rounding?: RoundingMode;
}

/**
 * Format a rial amount as a toman string for display.
 *
 * @example formatToman(rials(104_800_000n)) === '۱۰٬۴۸۰٬۰۰۰ تومان'
 */
export function formatToman(amount: Rials, options: TomanFormatOptions = {}): string {
  const { withUnit = true, persianDigits = true, rounding = 'half-up' } = options;

  const toman = rialsToToman(amount, rounding);
  const separator = persianDigits ? PERSIAN_THOUSANDS_SEPARATOR : ',';
  const grouped = groupThousands(toman.toString(), separator);
  const digits = persianDigits ? toPersianDigits(grouped) : grouped;

  return withUnit ? `${digits} تومان` : digits;
}

export interface GramFormatOptions {
  readonly withUnit?: boolean;
  readonly persianDigits?: boolean;
}

/**
 * Format a weight for display.
 *
 * @example formatGrams(gramsToMilligrams('1.8')) === '۱٫۸ گرم'
 */
export function formatGrams(weight: Milligrams, options: GramFormatOptions = {}): string {
  const { withUnit = true, persianDigits = true } = options;

  const plain = milligramsToGramString(weight);
  const [whole = '0', fraction] = plain.split('.');
  const separator = persianDigits ? PERSIAN_THOUSANDS_SEPARATOR : ',';
  const grouped = groupThousands(whole, separator);

  const decimalPoint = persianDigits ? PERSIAN_DECIMAL_SEPARATOR : '.';
  const joined = fraction === undefined ? grouped : `${grouped}${decimalPoint}${fraction}`;
  const digits = persianDigits ? toPersianDigits(joined) : joined;

  return withUnit ? `${digits} گرم` : digits;
}

/** Format a basis-point rate as a percentage, e.g. 700 -> '۷٪'. */
export function formatBasisPointsAsPercent(basisPoints: number, persianDigits = true): string {
  if (!Number.isSafeInteger(basisPoints)) {
    throw new MoneyError('basisPoints must be an integer');
  }
  const whole = Math.trunc(basisPoints / 100);
  const remainder = Math.abs(basisPoints % 100);

  let text = String(whole);
  if (remainder !== 0) {
    const fraction = String(remainder).padStart(2, '0').replace(/0+$/, '');
    text = `${text}.${fraction}`;
  }
  if (persianDigits) {
    text = toPersianDigits(text).replace('.', PERSIAN_DECIMAL_SEPARATOR);
  }
  return `${text}٪`;
}
