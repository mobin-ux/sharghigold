/**
 * Persian numeral helpers, ported from the design system's own
 * `components/utils/intl.js`.
 *
 * These exist for presentational text only — a percentage badge, a countdown,
 * an item count. Money never goes through here. Prices are computed and
 * formatted by `@sharghigold/money`, which works in whole rials as bigint and
 * is the only thing in this repository allowed to turn an amount into a
 * string. Keeping the two apart is the point: nothing in the design system
 * package should be able to render a price, so nothing here can render one
 * wrongly.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** U+066B ARABIC DECIMAL SEPARATOR — the decimal mark in Persian text. */
export const PERSIAN_DECIMAL_SEPARATOR = '٫';

/**
 * Convert ASCII digits to Persian ones.
 *
 * The design system's version stops there. This one also maps `.` to the
 * Persian decimal separator: `toFa('0.8')` in the source system produces
 * «۰.۸», mixing Persian numerals with an ASCII full stop, which is wrong
 * typographically and renders inconsistently in RTL runs.
 */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9.]/g, (character) =>
    character === '.'
      ? PERSIAN_DECIMAL_SEPARATOR
      : (PERSIAN_DIGITS[Number(character)] ?? character),
  );
}
