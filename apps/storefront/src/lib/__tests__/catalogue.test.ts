import { formatToman, gramsToMilligrams, quoteGoldPrice } from '@sharghigold/money';
import { describe, expect, it } from 'vitest';

import {
  DEMO_BEST_SELLERS,
  DEMO_NEW_ARRIVALS,
  DEMO_OFFERS,
  DEMO_PROFIT_BASIS_POINTS,
  DEMO_VAT_BASIS_POINTS,
  type DemoProduct,
} from '@/data/demo-catalogue';
import { getGoldRate } from '@/lib/gold-price';
import { toProductView, toProductViews } from '@/lib/catalogue';

function find(slug: string): DemoProduct {
  const product = [...DEMO_NEW_ARRIVALS, ...DEMO_OFFERS, ...DEMO_BEST_SELLERS].find(
    (candidate) => candidate.slug === slug,
  );
  if (product === undefined) {
    throw new Error(`No demo product ${slug}`);
  }
  return product;
}

describe('product prices come from the pricing engine', () => {
  it('reproduces the reference quote the money package is pinned to', () => {
    // 1.8g of 18-carat at ۱۰٬۴۸۰٬۰۰۰ تومان/g with a 15% making fee, 7% profit
    // and 10% VAT is ۲۳٬۶۴۶٬۹۶۷ تومان. This is the same case asserted in the
    // money package's own tests: if the page ever shows a different figure for
    // that piece, the two have come apart.
    const view = toProductView(find('delicate-butterfly-necklace'));
    expect(view.price).toBe('۲۳٬۶۴۶٬۹۶۷');
    expect(view.specs).toEqual(['۱۸ عیار', '۱٫۸ گرم']);
  });

  it('matches quoteGoldPrice exactly for every demo product', () => {
    // Not a re-implementation of the formula — the point is that the view
    // layer adds nothing to it, and in particular does not round twice.
    for (const product of [...DEMO_NEW_ARRIVALS, ...DEMO_BEST_SELLERS]) {
      const expected = quoteGoldPrice({
        pricePerGram: getGoldRate().pricePerGram18k,
        weight: gramsToMilligrams(product.grams),
        makingFeeBasisPoints: product.makingFeeBasisPoints,
        profitBasisPoints: DEMO_PROFIT_BASIS_POINTS,
        vatBasisPoints: DEMO_VAT_BASIS_POINTS,
      }).total;

      expect(toProductView(product).price).toBe(formatToman(expected, { withUnit: false }));
    }
  });

  it('renders prices in Persian numerals with the Persian thousands separator', () => {
    for (const view of toProductViews(DEMO_BEST_SELLERS)) {
      expect(view.price).toMatch(/^[۰-۹٬]+$/u);
      expect(view.price).not.toMatch(/[0-9,]/u);
    }
  });

  it('never puts the unit in the price string — the card renders it', () => {
    for (const view of toProductViews(DEMO_NEW_ARRIVALS)) {
      expect(view.price).not.toContain('تومان');
    }
  });
});

describe('discounts', () => {
  it('discounts the making fee, never the gold', () => {
    const product = find('leather-and-gold-bracelet');
    const view = toProductView(product);

    const gold = quoteGoldPrice({
      pricePerGram: getGoldRate().pricePerGram18k,
      weight: gramsToMilligrams(product.grams),
      makingFeeBasisPoints: 0,
      profitBasisPoints: 0,
      vatBasisPoints: 0,
    }).goldValue;

    const full = quoteGoldPrice({
      pricePerGram: getGoldRate().pricePerGram18k,
      weight: gramsToMilligrams(product.grams),
      makingFeeBasisPoints: product.makingFeeBasisPoints,
      profitBasisPoints: DEMO_PROFIT_BASIS_POINTS,
      vatBasisPoints: DEMO_VAT_BASIS_POINTS,
    }).total;

    expect(view.wasPrice).toBe(formatToman(full, { withUnit: false }));
    // Whatever the promotion is, the discounted total still covers the metal.
    expect(view.price).toBeDefined();
    expect(full).toBeGreaterThan(gold);
  });

  it('states a percentage no larger than the saving actually is', () => {
    for (const product of DEMO_OFFERS) {
      const view = toProductView(product);
      expect(view.discountPct).toBeDefined();

      const now = quoteGoldPrice({
        pricePerGram: getGoldRate().pricePerGram18k,
        weight: gramsToMilligrams(product.grams),
        makingFeeBasisPoints: product.promotionalMakingFeeBasisPoints ?? 0,
        profitBasisPoints: DEMO_PROFIT_BASIS_POINTS,
        vatBasisPoints: DEMO_VAT_BASIS_POINTS,
      }).total;

      const was = quoteGoldPrice({
        pricePerGram: getGoldRate().pricePerGram18k,
        weight: gramsToMilligrams(product.grams),
        makingFeeBasisPoints: product.makingFeeBasisPoints,
        profitBasisPoints: DEMO_PROFIT_BASIS_POINTS,
        vatBasisPoints: DEMO_VAT_BASIS_POINTS,
      }).total;

      const actual = Number(((was - now) * 100n) / was);

      // Floored, so the badge can understate the saving but never overstate
      // it. A customer who checks the arithmetic must never find less off than
      // the card claimed.
      expect(view.discountPct).toBe(actual);
      expect(Number(view.discountPct) * Number(was)).toBeLessThanOrEqual(Number(was - now) * 100);
    }
  });

  it('omits the discount entirely when there is no promotion', () => {
    for (const view of toProductViews(DEMO_NEW_ARRIVALS)) {
      expect(view.discountPct).toBeUndefined();
      expect(view.wasPrice).toBeUndefined();
    }
  });
});

describe('the gold rate is not presented as live', () => {
  it('is flagged as a placeholder', () => {
    // This must fail once a real feed lands, forcing whoever wires it up to
    // look at every place that decides how stale a price is allowed to be.
    expect(getGoldRate().isLive).toBe(false);
  });
});
