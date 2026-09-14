import { DEFAULT_LISTING_QUERY, type ListingQuery } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import {
  categoryFacets,
  clearedHref,
  countLabel,
  emptyCopy,
  listingHref,
  PRICE_SLIDER,
  rialsToSlider,
  sameWeight,
  sliderToRials,
  weightOf,
} from '../listing-view';
import { routes } from '../routes';
import { CATEGORY_TAXONOMY } from '@/server/catalogue/taxonomy';
import { subTypeHeading, categoryCopy } from '@/server/content/category-copy';

const query = (patch: Partial<ListingQuery> = {}): ListingQuery => ({
  ...DEFAULT_LISTING_QUERY,
  ...patch,
});

describe('listing URLs', () => {
  it('writes nothing for a default query, including the new flag and sort', () => {
    expect(listingHref('/products', query())).toBe('/products');
    expect(listingHref('/products', query({ sort: 'newest', freeShipping: false }))).toBe(
      '/products',
    );
    expect(listingHref('/products', query(), { freeShipping: true })).toBe(
      '/products?freeShipping=1',
    );
  });

  it('keeps the search term when filters are cleared', () => {
    const searched = query({ q: 'حلقه', inStock: true, karat: 18, page: 3 });
    expect(clearedHref('/search', searched)).toBe('/search?q=%D8%AD%D9%84%D9%82%D9%87');
  });
});

describe('the filter sheet', () => {
  const earrings = CATEGORY_TAXONOMY.find((category) => category.slug === 'earrings');
  if (earrings === undefined) throw new Error('earrings missing from the taxonomy');
  const facets = categoryFacets(earrings, (slug) => routes.category(slug));

  it('offers the category’s own sub-types and weight bands, not «all»', () => {
    expect(facets.models.map((model) => model.label)).toEqual([
      'آویز',
      'حلقه‌ای',
      'میخی',
      'بخیه‌ای',
      'مجلسی',
    ]);
    expect(facets.models[0]?.basePath).toBe('/categories/earrings-drop');
    expect(facets.weightBands.map((band) => [band.minWeightMg, band.maxWeightMg])).toEqual([
      [null, '2000'],
      ['2000', '5000'],
      ['5000', null],
    ]);
  });

  it('recognises the band a URL is already filtering by', () => {
    const band = facets.weightBands[1];
    expect(band).toBeDefined();
    expect(
      sameWeight(weightOf(query({ minWeightMg: '2000', maxWeightMg: '5000' })), band ?? null),
    ).toBe(true);
    expect(sameWeight(weightOf(query({ minWeightMg: '2000' })), band ?? null)).toBe(false);
    expect(weightOf(query())).toBeNull();
  });

  it('treats the top of the price slider as no cap', () => {
    expect(sliderToRials(PRICE_SLIDER.max)).toBeNull();
    expect(sliderToRials(60)).toBe('600000000');
    expect(rialsToSlider(undefined)).toBe(PRICE_SLIDER.max);
    expect(rialsToSlider('600000000')).toBe(60);
    // A cap from a URL that is not on a step snaps down, never up.
    expect(rialsToSlider('637000000')).toBe(60);
    expect(rialsToSlider('9990000000')).toBe(PRICE_SLIDER.max);
  });
});

describe('labels', () => {
  it('counts in Persian digits', () => {
    expect(countLabel(24)).toBe('۲۴ کالا');
  });

  it('offers to clear only when a filter is what emptied the grid', () => {
    expect(emptyCopy(query({ karat: 24 }), 1).canClear).toBe(true);
    expect(emptyCopy(query({ q: 'ساعت' }), 0).canClear).toBe(false);
    expect(emptyCopy(query(), 0).canClear).toBe(false);
  });

  it('names a sub-type after its category only where that reads as one name', () => {
    expect(subTypeHeading(categoryCopy('earrings', 'گوشواره'), 'آویز')).toBe('گوشواره آویز');
    expect(subTypeHeading(categoryCopy('rings', 'انگشتر'), 'انگشتر مردانه')).toBe('انگشتر مردانه');
    expect(subTypeHeading(categoryCopy('sets', 'سرویس و نیم‌ست'), 'ست هدیه')).toBe('ست هدیه');
    expect(categoryCopy('watches', 'ساعت')).toMatchObject({ heading: 'ساعت', hasGuide: false });
  });
});
