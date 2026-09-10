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
import { MILLIGRAMS_PER_GRAM, milligramsToGramString, type Milligrams } from './weight.js';

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
  /** Defaults to `trunc`. See the note on the default in {@link formatToman}. */
  readonly rounding?: RoundingMode;
}

/**
 * Format a rial amount as a toman string for display.
 *
 * The default rounding is `trunc`, not `half-up`, and that is a deliberate
 * asymmetry. A rial amount that is not a whole number of toman would, under
 * half-up, display *more* than the customer is actually charged — 105 rials
 * would read as ۱۱ تومان, i.e. 110. Rounding a displayed price up in the shop's
 * own favour is exactly the kind of quiet discrepancy this package exists to
 * prevent, so the remainder is dropped instead. The same reasoning already
 * governs `discountPercent` in the storefront, which floors rather than rounds.
 *
 * This is a presentation default only. Nothing is *charged* from this function:
 * the authoritative total is the rial figure, and `quoteGoldPrice` computes it.
 *
 * @example formatToman(rials(104_800_000n)) === '۱۰٬۴۸۰٬۰۰۰ تومان'
 */
export function formatToman(amount: Rials, options: TomanFormatOptions = {}): string {
  const { withUnit = true, persianDigits = true, rounding = 'trunc' } = options;

  const toman = rialsToToman(amount, rounding);
  const separator = persianDigits ? PERSIAN_THOUSANDS_SEPARATOR : ',';
  const grouped = groupThousands(toman.toString(), separator);
  const digits = persianDigits ? toPersianDigits(grouped) : grouped;

  return withUnit ? `${digits} تومان` : digits;
}

export interface GramFormatOptions {
  readonly withUnit?: boolean;
  readonly persianDigits?: boolean;
  /**
   * Pad — or round — to exactly this many decimal places.
   *
   * The trade quotes a piece to two decimals, so 2,800 mg is «۲٫۸۰ گرم» and
   * not «۲٫۸». Omitted, the fraction is whatever the weight needs.
   */
  readonly fractionDigits?: number;
}

/**
 * Format a weight for display.
 *
 * @example formatGrams(gramsToMilligrams('1.8')) === '۱٫۸ گرم'
 */
export function formatGrams(weight: Milligrams, options: GramFormatOptions = {}): string {
  const { withUnit = true, persianDigits = true, fractionDigits } = options;

  const plain =
    fractionDigits === undefined
      ? milligramsToGramString(weight)
      : fixedGramString(weight, fractionDigits);
  const [whole = '0', fraction] = plain.split('.');
  const separator = persianDigits ? PERSIAN_THOUSANDS_SEPARATOR : ',';
  const grouped = groupThousands(whole, separator);

  const decimalPoint = persianDigits ? PERSIAN_DECIMAL_SEPARATOR : '.';
  const joined = fraction === undefined ? grouped : `${grouped}${decimalPoint}${fraction}`;
  const digits = persianDigits ? toPersianDigits(joined) : joined;

  return withUnit ? `${digits} گرم` : digits;
}

/**
 * Grams to exactly `fractionDigits` decimal places.
 *
 * Scaled and rounded as integers rather than by formatting a float: at three
 * decimals a milligram is the last significant digit, and asking for two means
 * a real rounding decision that `toFixed` would make in binary.
 */
function fixedGramString(weight: Milligrams, fractionDigits: number): string {
  if (!Number.isSafeInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new MoneyError(
      `fractionDigits must be between 0 and 6, received ${String(fractionDigits)}`,
    );
  }

  const scale = 10n ** BigInt(fractionDigits);
  const scaled = divideRounded(weight * scale, MILLIGRAMS_PER_GRAM, 'half-up');
  const whole = scaled / scale;

  if (fractionDigits === 0) return whole.toString();

  return `${whole.toString()}.${(scaled % scale).toString().padStart(fractionDigits, '0')}`;
}

/** Format a basis-point rate as a percentage, e.g. 700 -> '۷٪'. */
export function formatBasisPointsAsPercent(basisPoints: number, persianDigits = true): string {
  if (!Number.isSafeInteger(basisPoints)) {
    throw new MoneyError('basisPoints must be an integer');
  }
  // The sign is carried separately: Math.trunc(-50 / 100) is -0, and
  // String(-0) is '0', which would silently render -0.5% as ۰٫۵٪.
  const negative = basisPoints < 0;
  const magnitude = Math.abs(basisPoints);
  const whole = Math.trunc(magnitude / 100);
  const remainder = magnitude % 100;

  let text = String(whole);
  if (remainder !== 0) {
    const fraction = String(remainder).padStart(2, '0').replace(/0+$/, '');
    text = `${text}.${fraction}`;
  }
  if (negative) text = `-${text}`;
  if (persianDigits) {
    text = toPersianDigits(text).replace('.', PERSIAN_DECIMAL_SEPARATOR);
  }
  return `${text}٪`;
}
