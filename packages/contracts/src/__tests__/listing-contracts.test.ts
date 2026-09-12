import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LISTING_QUERY,
  DEFAULT_PRODUCT_SORT,
  LISTING_MAX_PAGE,
  parseListingQuery,
  productSummarySchema,
} from '../index.js';

/**
 * A listing URL is the widest untrusted surface a shop has: anyone can write
 * one and send it to anyone. So what is pinned here is that the parser is
 * *closed* — every value it does not recognise becomes an absent filter rather
 * than a value that travels onwards — and that the result is always complete,
 * so no caller downstream has to ask whether a filter was present.
 */

describe('parsing a listing URL', () => {
  it('returns every filter defaulted, even from an empty URL', () => {
    expect(parseListingQuery({})).toEqual(DEFAULT_LISTING_QUERY);
    expect(parseListingQuery({}).sort).toBe(DEFAULT_PRODUCT_SORT);
    expect(parseListingQuery({}).page).toBe(1);
  });

  it('keeps the filters it understands', () => {
    const query = parseListingQuery({
      category: 'earrings',
      sort: 'price-asc',
      page: '3',
      maxPrice: '500000000',
      minWeightMg: '2000',
      karat: '18',
      colour: 'rose',
      discounted: '1',
    });

    expect(query.category).toBe('earrings');
    expect(query.sort).toBe('price-asc');
    expect(query.page).toBe(3);
    expect(query.maxPriceRials).toBe('500000000');
    expect(query.minWeightMg).toBe('2000');
    expect(query.karat).toBe(18);
    expect(query.colour).toBe('rose');
    expect(query.discounted).toBe(true);
  });

  it('drops a value it does not recognise instead of passing it on', () => {
    // The important half: `sort` falls back rather than reaching a query, and
    // a category that is not a slug is simply not a category.
    const query = parseListingQuery({
      sort: "price-asc'; DROP TABLE products; --",
      category: '../../etc/passwd',
      karat: '19',
      colour: 'platinum',
      maxPrice: '1e9',
      minWeightMg: '-100',
    });

    expect(query.sort).toBe(DEFAULT_PRODUCT_SORT);
    expect(query.category).toBeUndefined();
    expect(query.karat).toBeUndefined();
    expect(query.colour).toBeUndefined();
    expect(query.maxPriceRials).toBeUndefined();
    expect(query.minWeightMg).toBeUndefined();
  });

  it('reads «false» as false, which a truthiness check would not', () => {
    expect(parseListingQuery({ discounted: 'false' }).discounted).toBe(false);
    expect(parseListingQuery({ discounted: '0' }).discounted).toBe(false);
    expect(parseListingQuery({ discounted: 'off' }).discounted).toBe(false);
    expect(parseListingQuery({ discounted: 'true' }).discounted).toBe(true);
    expect(parseListingQuery({ discounted: 'yes' }).discounted).toBe(false);
  });

  it('bounds the page, so no URL can ask for an unbounded scan', () => {
    expect(parseListingQuery({ page: String(LISTING_MAX_PAGE) }).page).toBe(LISTING_MAX_PAGE);
    expect(parseListingQuery({ page: '99999999' }).page).toBe(1);
    expect(parseListingQuery({ page: '0' }).page).toBe(1);
    expect(parseListingQuery({ page: '-4' }).page).toBe(1);
    expect(parseListingQuery({ page: 'two' }).page).toBe(1);
  });

  it('takes the first value when a parameter is repeated', () => {
    expect(parseListingQuery({ sort: ['newest', 'price-desc'] }).sort).toBe('newest');
  });

  it('bounds the search term rather than trusting its length', () => {
    expect(parseListingQuery({ q: 'گوشواره' }).q).toBe('گوشواره');
    expect(parseListingQuery({ q: 'ا'.repeat(81) }).q).toBeUndefined();
  });
});

describe('a card in the grid', () => {
  const card = {
    slug: 'star-drop-earrings',
    title: 'گوشواره آویز ستاره',
    categoryTitle: 'گوشواره',
    specs: ['۱۸ عیار', '۲٫۱ گرم'],
    price: '۲۷٬۵۸۸٬۱۲۸',
    wasPrice: null,
    discountPercent: null,
    installment: true,
    inStock: true,
  };

  it('is accepted as the shop produces it', () => {
    expect(productSummarySchema.safeParse(card).success).toBe(true);
  });

  it('carries no figure a client could send back as an authority', () => {
    // The card names a slug. Everything else on it is text for a human, and
    // adding the piece to a basket sends the slug and nothing else.
    const keys = Object.keys(productSummarySchema.parse(card));
    expect(keys.some((key) => /rial|amount|weightMilligrams/i.test(key))).toBe(false);
  });

  it('refuses a discount badge of zero or a hundred percent', () => {
    expect(productSummarySchema.safeParse({ ...card, discountPercent: 0 }).success).toBe(false);
    expect(productSummarySchema.safeParse({ ...card, discountPercent: 100 }).success).toBe(false);
    expect(productSummarySchema.safeParse({ ...card, discountPercent: 7 }).success).toBe(true);
  });
});
