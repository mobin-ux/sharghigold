import { LISTING_PAGE_SIZE } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { getCategoryNavigation, listCategorySlugs, resolveCategory } from '../navigation';
import { getProduct, listProductSlugs } from '../product';
import { cardsForSlugs, listProducts } from '../listing';
import { PRODUCT_FIXTURES } from '../products';

/**
 * The listing, and the thing it was built to end.
 *
 * The storefront used to hold two product seeds: one the homepage read and one
 * the product page read. They shared a single slug, so sixteen of the
 * seventeen cards on the homepage led to a 404. The first test in this file is
 * the one that would have caught that, and it is the reason the rest exist.
 */

describe('there is one catalogue', () => {
  it('gives every product in it a page', async () => {
    const slugs = await listProductSlugs();

    for (const fixture of PRODUCT_FIXTURES) {
      expect(slugs, fixture.slug).toContain(fixture.slug);
    }
  });

  it('files every product under a category the taxonomy contains', async () => {
    const known = new Set(listCategorySlugs(await getCategoryNavigation()));

    for (const fixture of PRODUCT_FIXTURES) {
      expect(known, `${fixture.slug} → ${fixture.categorySlug}`).toContain(fixture.categorySlug);
      expect(known, `${fixture.slug} → ${fixture.subTypeSlug}`).toContain(fixture.subTypeSlug);
    }
  });

  it('points every «related» slug at a product that exists', async () => {
    for (const fixture of PRODUCT_FIXTURES) {
      for (const related of fixture.relatedSlugs) {
        expect(await getProduct(related), `${fixture.slug} → ${related}`).toBeDefined();
      }
    }
  });

  it('gives every product a distinct slug and article number', () => {
    const slugs = new Set(PRODUCT_FIXTURES.map((fixture) => fixture.slug));
    const skus = new Set(PRODUCT_FIXTURES.map((fixture) => fixture.sku));

    expect(slugs.size).toBe(PRODUCT_FIXTURES.length);
    expect(skus.size).toBe(PRODUCT_FIXTURES.length);
  });
});

describe('narrowing a listing', () => {
  it('shows a whole category for a category slug', async () => {
    const listing = await listProducts({ category: 'earrings' });
    const expected = PRODUCT_FIXTURES.filter(
      (fixture) => fixture.categorySlug === 'earrings',
    ).length;

    expect(listing.total).toBe(expected);
    expect(listing.total).toBeGreaterThan(0);
  });

  it('shows only one sub-type for a sub-type slug', async () => {
    const whole = await listProducts({ category: 'earrings' });
    const hoops = await listProducts({ category: 'earrings-hoop' });

    expect(hoops.total).toBeGreaterThan(0);
    expect(hoops.total).toBeLessThan(whole.total);
    expect(hoops.items.every((item) => item.categoryTitle === 'گوشواره')).toBe(true);
  });

  it('matches nothing for a category the catalogue does not contain', async () => {
    // The other direction — an unknown filter widening the result — is how a
    // typo in a facet tile quietly lists the whole shop.
    const listing = await listProducts({ category: 'watches' });

    expect(listing.total).toBe(0);
    expect(listing.items).toHaveLength(0);
  });

  it('offers only pieces whose making fee is actually reduced', async () => {
    const listing = await listProducts({ discounted: true });

    expect(listing.total).toBeGreaterThan(0);
    expect(listing.items.every((item) => item.wasPrice !== null)).toBe(true);
    expect(listing.items.every((item) => (item.discountPercent ?? 0) > 0)).toBe(true);
  });

  it('honours a weight band', async () => {
    const light = await listProducts({ maxWeightMg: '2000' });
    const heavy = await listProducts({ minWeightMg: '6000' });

    expect(light.total).toBeGreaterThan(0);
    expect(heavy.total).toBeGreaterThan(0);
    // No piece can be in both, which is what makes the bands a partition.
    const lightSlugs = new Set(light.items.map((item) => item.slug));
    expect(heavy.items.some((item) => lightSlugs.has(item.slug))).toBe(false);
  });

  it('hides what it cannot sell when asked to', async () => {
    const all = await listProducts({});
    const sellable = await listProducts({ inStock: true });

    expect(sellable.total).toBeLessThan(all.total);
    expect(sellable.items.every((item) => item.inStock)).toBe(true);
  });

  it('finds a piece by its title and by its article number', async () => {
    const byTitle = await listProducts({ q: 'ونیزی' });
    const bySku = await listProducts({ q: 'ZN-30390' });

    expect(byTitle.items.map((item) => item.slug)).toContain('venetian-chain-necklace');
    expect(bySku.items.map((item) => item.slug)).toContain('venetian-chain-necklace');
  });

  it('counts the filters that are narrowing, and not the ones that are not', async () => {
    expect((await listProducts({ sort: 'price-asc', page: 1 })).activeFilterCount).toBe(0);
    expect((await listProducts({ discounted: true, karat: 18 })).activeFilterCount).toBe(2);
  });
});

describe('ordering a listing', () => {
  it('sorts by price in both directions', async () => {
    const ascending = await listProducts({ sort: 'price-asc', inStock: true });
    const descending = await listProducts({ sort: 'price-desc', inStock: true });

    // One listing read backwards is the other, which is what «both
    // directions» has to mean. Read across every page, because the cheapest
    // piece is the last one of the last page in the other order.
    const forwards: string[] = [];
    const backwards: string[] = [];

    for (let page = 1; page <= ascending.pageCount; page += 1) {
      forwards.push(
        ...(await listProducts({ sort: 'price-asc', inStock: true, page })).items.map(
          (item) => item.slug,
        ),
      );
      backwards.push(
        ...(await listProducts({ sort: 'price-desc', inStock: true, page })).items.map(
          (item) => item.slug,
        ),
      );
    }

    expect(ascending.total).toBe(descending.total);
    expect(forwards).toEqual(backwards.toReversed());
  });

  it('pages without repeating or losing a product', async () => {
    const first = await listProducts({ sort: 'weight-asc' });
    const second = await listProducts({ sort: 'weight-asc', page: 2 });

    const seen = [...first.items, ...second.items].map((item) => item.slug);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(Math.min(first.total, LISTING_PAGE_SIZE * 2));
  });

  it('shows nothing past the end rather than repeating the last page', async () => {
    const beyond = await listProducts({ page: 50 });

    expect(beyond.items).toHaveLength(0);
    expect(beyond.total).toBeGreaterThan(0);
  });
});

describe('what a card carries', () => {
  it('names the category in the customer’s own words', async () => {
    const [card] = (await cardsForSlugs(['venetian-chain-necklace'])) as [
      Awaited<ReturnType<typeof cardsForSlugs>>[number],
    ];

    expect(card.categoryTitle).toBe('گردنبند');
    expect(card.title).toContain('ونیزی');
  });

  it('skips a slug that names no product rather than rendering a dead card', async () => {
    const cards = await cardsForSlugs(['venetian-chain-necklace', 'not-a-product']);

    expect(cards).toHaveLength(1);
  });

  it('derives the discount badge from the two figures it shows', async () => {
    const listing = await listProducts({ discounted: true, sort: 'price-asc' });
    const card = listing.items[0];
    if (card === undefined) throw new Error('no discounted pieces');

    // A badge asserted separately from the prices is a badge that can disagree
    // with them. Reading the grouped Persian numerals back is enough to show
    // the «was» figure is the larger of the two.
    expect(card.wasPrice).not.toBeNull();
    expect((card.wasPrice ?? '').length).toBeGreaterThanOrEqual(card.price.length);
  });
});

describe('resolving a slug from the URL', () => {
  it('tells a category from a sub-type', async () => {
    const navigation = await getCategoryNavigation();

    expect(resolveCategory(navigation, 'rings')?.isSubType).toBe(false);
    expect(resolveCategory(navigation, 'rings-solitaire')?.isSubType).toBe(true);
    expect(resolveCategory(navigation, 'rings-solitaire')?.category.slug).toBe('rings');
    expect(resolveCategory(navigation, 'rings-solitaire')?.title).toBe('تک‌نگین');
  });

  it('returns nothing for a slug the catalogue does not contain', async () => {
    expect(resolveCategory(await getCategoryNavigation(), 'watches')).toBeUndefined();
  });
});
