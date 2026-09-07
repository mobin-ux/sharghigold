import { formatToman, rials, type Rials } from '@sharghigold/money';
import type { TickerItem } from '@sharghigold/ui';

import { getGoldRate } from '@/lib/gold-price';

/**
 * The live-price strip.
 *
 * PLACEHOLDER quotes, except the 18-carat gram, which comes from the same
 * `getGoldRate()` every price on the page is computed from. That is
 * deliberate: a ticker that says one number while the product cards are priced
 * off another is worse than no ticker, and it is exactly the kind of drift
 * that appears once the two are allowed separate sources.
 *
 * Every figure is formatted here, on the server, from whole rials. The strip
 * receives strings.
 */
interface Quote {
  readonly name: string;
  readonly price: Rials;
  /** Percentage movement. Presentational only; never used in a calculation. */
  readonly change: number;
}

export interface TickerData {
  readonly items: readonly TickerItem[];
  /** When these figures were taken. Shown so «لحظه‌ای» is not a bare claim. */
  readonly asOf: string;
}

export function buildTicker(): TickerData {
  const rate = getGoldRate();

  const quotes: readonly Quote[] = [
    { name: 'طلای ۱۸ عیار (گرم)', price: rate.pricePerGram18k, change: 0.8 },
    { name: 'مظنه آب‌شده', price: rials(453_600_000n), change: 0.6 },
    { name: 'سکه امامی', price: rials(6_125_000_000n), change: -0.4 },
    { name: 'نیم‌سکه', price: rials(3_180_000_000n), change: 0.3 },
  ];

  return {
    items: quotes.map((quote) => ({
      name: quote.name,
      price: formatToman(quote.price, { withUnit: false }),
      change: quote.change,
    })),
    asOf: rate.asOf,
  };
}
