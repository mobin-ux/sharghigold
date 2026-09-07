import { toPersianDigits } from '../intl.js';

export interface PriceChangeProps {
  /**
   * Movement as a percentage: `0.8` means «۰٫۸٪ افزایش».
   *
   * This is presentational market data. It is never used in a calculation —
   * anything that affects what a customer pays is computed in whole rials by
   * `@sharghigold/money`, never from a percentage held as a float.
   */
  readonly value?: number;
  readonly suffix?: string;
  /** Drop the tinted pill and render the figure inline. */
  readonly bare?: boolean;
}

const Up = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 15 6-6 6 6" />
  </svg>
);

const Down = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * `<PriceChange>` — the design system's `.zn-pchg`.
 *
 * Direction is carried by colour and an arrow, so it also gets a visually
 * hidden word: «افزایش» / «کاهش». Colour alone is not an accessible signal,
 * and an arrow glyph is not announced.
 */
export function PriceChange({ value = 0, suffix = '٪', bare = false }: PriceChangeProps) {
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const label = direction === 'up' ? 'افزایش' : direction === 'down' ? 'کاهش' : 'بدون تغییر';

  const className = ['zn-pchg', `zn-pchg--${direction}`, bare ? 'zn-pchg--bare' : null]
    .filter((part) => part !== null)
    .join(' ');

  return (
    <span className={className}>
      <span className="sr-only">{label}</span>
      {direction === 'flat' ? null : (
        <span aria-hidden="true">{direction === 'up' ? <Up /> : <Down />}</span>
      )}
      {toPersianDigits(Math.abs(value))}
      {suffix}
    </span>
  );
}
