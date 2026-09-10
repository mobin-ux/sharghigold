import { productDetailSchema, type ReviewQuery } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { getProduct, getRelatedProducts, listProductSlugs } from '@/server/catalogue/product';
import { getRatingSummary, getReviewPage } from '@/server/catalogue/reviews';

const ALL: ReviewQuery = { filter: 'all', sort: 'helpful', limit: 50 };

const solitaire = await getProduct('classic-solitaire-ring');
if (solitaire === undefined) throw new Error('fixture missing: classic-solitaire-ring');

describe('product gateway', () => {
  it('matches the shared contract', () => {
    expect(() => productDetailSchema.parse(solitaire)).not.toThrow();
  });

  it('parses every product in the catalogue, not just the one asked for', async () => {
    // The whole fixture is built and parsed on first access, so a product that
    // has drifted from the contract fails here rather than the first time
    // somebody opens its page.
    const slugs = await listProductSlugs();
    const products = await Promise.all(slugs.map(async (slug) => getProduct(slug)));

    for (const product of products) {
      expect(() => productDetailSchema.parse(product)).not.toThrow();
    }
  });

  it('answers with undefined for a slug it does not have', async () => {
    // Arbitrary text from a URL. It reaches a map lookup and nothing else.
    expect(await getProduct('no-such-ring')).toBeUndefined();
    expect(await getProduct('../../etc/passwd')).toBeUndefined();
    expect(await getProduct('')).toBeUndefined();
  });

  it('carries weight as whole milligrams, never as a float', () => {
    expect(solitaire.weightMilligrams).toBe('2800');
    expect(solitaire.weightToleranceMilligrams).toBe('50');
    expect(Number.isInteger(Number(solitaire.weightMilligrams))).toBe(true);
  });

  it('carries no price of any kind', () => {
    // The point of the record: nothing here can be a stale or tampered figure,
    // because there is no figure. It is derived on every render.
    const keys = Object.keys(solitaire).join(' ').toLowerCase();

    expect(keys).not.toContain('price');
    expect(keys).not.toContain('total');
    expect(keys).not.toContain('rial');
  });

  it('derives its rating from the reviews rather than storing one', async () => {
    const page = await getReviewPage(solitaire.slug, ALL);
    const stars = page.reviews.reduce((sum, review) => sum + review.stars, 0);
    const mean = Math.round((stars * 10) / page.reviews.length) / 10;

    expect(solitaire.rating.total).toBe(page.reviews.length);
    expect(Number(solitaire.rating.average)).toBeCloseTo(mean, 5);

    const counted = solitaire.rating.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    expect(counted).toBe(solitaire.rating.total);
  });

  it('reports a rating of zero for a product nobody has reviewed', () => {
    const summary = getRatingSummary('no-such-ring');

    expect(summary.total).toBe(0);
    expect(summary.average).toBe('0.0');
    expect(summary.buckets).toHaveLength(5);
  });

  it('resolves related products and drops any that no longer exist', async () => {
    const related = await getRelatedProducts(solitaire);

    expect(related.map((product) => product.slug)).toEqual(solitaire.relatedSlugs);

    const withGhost = { ...solitaire, relatedSlugs: ['delicate-band-ring', 'sold-out-ring'] };
    // A withdrawn piece leaves the rail rather than leaving a card that 404s.
    expect((await getRelatedProducts(withGhost)).map((p) => p.slug)).toEqual([
      'delicate-band-ring',
    ]);
  });

  it('gives every gallery frame a real description', () => {
    for (const frame of solitaire.media) {
      expect(frame.alt.length).toBeGreaterThan(8);
      expect(frame.alt).not.toMatch(/^تصویر ?\d*$/u);
    }
  });
});
