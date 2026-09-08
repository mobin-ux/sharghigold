import { categoryNavigationSchema } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { MARKS } from '@/components/marks/registry';
import { tileHref } from '@/lib/catalogue-href';
import { getCategoryNavigation, selectCategory } from '@/server/catalogue/navigation';

const navigation = await getCategoryNavigation();

describe('category navigation', () => {
  it('matches the shared contract', () => {
    // The gateway parses on the way out, so reaching here already proves it.
    // Re-parsing states the intent: this fixture is the API's shape, and a
    // change to either that the other does not follow is a failure here
    // rather than a blank tile in production.
    expect(() => categoryNavigationSchema.parse(navigation)).not.toThrow();
  });

  it('covers the eight categories the design browses', () => {
    expect(navigation.categories.map((category) => category.slug)).toEqual([
      'earrings',
      'necklaces',
      'rings',
      'bangles',
      'bracelets',
      'sets',
      'coins',
      'gifts',
    ]);
  });

  it('offers instalments everywhere except bullion', () => {
    // Bullion sells against spot with no making fee, so there is no margin to
    // carry a plan. If this ever flips, it is a commercial decision and not a
    // typo in the fixture.
    const ineligible = navigation.categories
      .filter((category) => !category.installmentEligible)
      .map((category) => category.slug);

    expect(ineligible).toEqual(['coins']);
  });

  it('closes every group with an unfiltered «همه کالاها» tile', () => {
    for (const category of navigation.categories) {
      for (const group of category.groups) {
        const last = group.tiles.at(-1);

        expect(last?.label, `${category.slug}/${group.kind}`).toBe('همه کالاها');
        expect(last?.icon, `${category.slug}/${group.kind}`).toBeNull();
        // It clears the group's filter rather than adding one.
        expect(Object.keys(last?.query ?? {}), `${category.slug}/${group.kind}`).toEqual([]);
      }
    }
  });

  it('names only marks that exist', () => {
    // The failure this catches is silent: an icon key with a typo falls back
    // to a generic drawing, so the page still renders and the tile is simply
    // wrong. Nothing else would notice.
    const missing: string[] = [];

    for (const category of navigation.categories) {
      if (!(category.icon in MARKS)) missing.push(`${category.slug} → ${category.icon}`);

      for (const group of category.groups) {
        for (const tile of group.tiles) {
          if (tile.icon !== null && !(tile.icon in MARKS)) {
            missing.push(`${category.slug}/${group.kind}/${tile.label} → ${tile.icon}`);
          }
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('keeps prices in rials and weights in milligrams', () => {
    // The labels speak toman because customers do; the filters must not.
    // «تا ۱۰ میلیون» is 10,000,000 toman — 100,000,000 rials.
    const earrings = navigation.categories.find((category) => category.slug === 'earrings');
    const budget = earrings?.groups.find((group) => group.kind === 'budget');

    expect(budget?.tiles[0]?.query).toEqual({ maxPrice: '100000000' });

    const weight = earrings?.groups.find((group) => group.kind === 'weight');
    expect(weight?.tiles[0]?.query).toEqual({ maxWeightMg: '2000' });
    expect(weight?.tiles[1]?.query).toEqual({ minWeightMg: '2000', maxWeightMg: '5000' });
  });
});

describe('selectCategory', () => {
  it('returns the requested category', () => {
    expect(selectCategory(navigation, 'coins').slug).toBe('coins');
  });

  it('falls back to the first category when none is asked for', () => {
    expect(selectCategory(navigation, undefined).slug).toBe('earrings');
  });

  it('cannot be steered anywhere outside the catalogue', () => {
    // The value is a query parameter, so it is arbitrary text from the URL.
    // It is only ever matched against known slugs, never used to build one.
    const hostile = [
      '../../etc/passwd',
      'earrings/../admin',
      '<script>alert(1)</script>',
      'https://example.invalid',
      '',
      'EARRINGS',
    ];

    for (const value of hostile) {
      expect(selectCategory(navigation, value).slug, value).toBe('earrings');
    }
  });
});

describe('tileHref', () => {
  it('links a plain category without a query string', () => {
    expect(tileHref({ label: 'x', slug: 'earrings', query: {}, icon: null })).toBe(
      '/categories/earrings',
    );
  });

  it('carries filters as query parameters', () => {
    expect(
      tileHref({
        label: 'x',
        slug: 'earrings',
        query: { minWeightMg: '2000', maxWeightMg: '5000' },
        icon: null,
      }),
    ).toBe('/categories/earrings?minWeightMg=2000&maxWeightMg=5000');
  });

  it('produces a well-formed URL for every tile in the catalogue', () => {
    for (const category of navigation.categories) {
      for (const group of category.groups) {
        for (const tile of group.tiles) {
          const href = tileHref(tile);

          expect(href.startsWith('/categories/'), href).toBe(true);
          // Resolves without throwing, and stays on this origin.
          const url = new URL(href, 'https://example.test');
          expect(url.origin).toBe('https://example.test');
        }
      }
    }
  });
});
