import type { PriceLine } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import {
  lockLabel,
  persianCount,
  persianDecimal,
  priceLineLabel,
  ratingPercent,
  relativeTime,
  toman,
  weightLabel,
} from '@/lib/product-view';

const NOW = new Date('2026-09-10T12:00:00.000Z');

describe('numbers a customer reads', () => {
  it('groups a rial amount into Persian toman', () => {
    // 377,432,500 rials is 37,743,250 toman.
    expect(toman('377432500')).toBe('۳۷٬۷۴۳٬۲۵۰');
  });

  it('holds amounts far past what a double can represent exactly', () => {
    const huge = '9007199254740993000';

    // Number(huge) loses the last digits. The string never became a number.
    expect(toman(huge)).toBe('۹۰۰٬۷۱۹٬۹۲۵٬۴۷۴٬۰۹۹٬۳۰۰');
  });

  it('quotes a weight to the two decimals the trade uses', () => {
    expect(weightLabel('2800')).toBe('۲٫۸۰ گرم');
    expect(weightLabel('1600', false)).toBe('۱٫۶۰');
  });

  it('pads both halves of the price lock so the width never moves', () => {
    expect(lockLabel(300)).toBe('۰۵:۰۰');
    expect(lockLabel(59)).toBe('۰۰:۵۹');
    expect(lockLabel(0)).toBe('۰۰:۰۰');
    // A clock that has run past its deadline reads zero, not a negative.
    expect(lockLabel(-30)).toBe('۰۰:۰۰');
  });

  it('turns a decimal into Persian with the Persian separator', () => {
    // U+066B, not a full stop: «۴.۳» reads as four thousand three hundred.
    expect(persianDecimal('4.3')).toBe('۴٫۳');
    expect(persianDecimal('54.4')).toBe('۵۴٫۴');
    expect(persianCount(124)).toBe('۱۲۴');
  });

  it('computes a rating bar as a whole percentage, and copes with no reviews', () => {
    expect(ratingPercent(3, 6)).toBe(50);
    expect(ratingPercent(1, 3)).toBe(33);
    expect(ratingPercent(0, 0)).toBe(0);
  });
});

const line = (over: Partial<PriceLine>): PriceLine => ({
  kind: 'making-fee',
  amountRials: '1',
  basisPoints: 1_800,
  ...over,
});

describe('breakdown labels', () => {
  it('names the rate, so the figure can be checked rather than accepted', () => {
    expect(priceLineLabel(line({}), '2800')).toBe('اجرت ساخت (۱۸٪)');
    expect(priceLineLabel(line({ kind: 'vat', basisPoints: 900 }), '2800')).toBe(
      'مالیات بر ارزش افزوده (۹٪)',
    );
  });

  it('names the weight on the gold line, which is not a percentage of anything', () => {
    expect(priceLineLabel(line({ kind: 'gold-value', basisPoints: null }), '2800')).toBe(
      'ارزش طلا (۲٫۸۰ گرم × نرخ روز)',
    );
  });
});

describe('relative dates', () => {
  const ago = (days: number) =>
    relativeTime(new Date(NOW.getTime() - days * 86_400_000).toISOString(), NOW);

  it('reads the way a person reads a date', () => {
    expect(ago(0)).toBe('امروز');
    expect(ago(1)).toBe('دیروز');
    expect(ago(3)).toBe('۳ روز پیش');
    expect(ago(14)).toBe('۲ هفته پیش');
    expect(ago(60)).toBe('۲ ماه پیش');
    expect(ago(400)).toBe('۱ سال پیش');
  });

  it('does not read the future as the past', () => {
    expect(relativeTime(new Date(NOW.getTime() + 86_400_000).toISOString(), NOW)).toBe('امروز');
  });
});
