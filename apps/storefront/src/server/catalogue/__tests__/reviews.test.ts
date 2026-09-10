import { reviewPageSchema, reviewQuerySchema, type ReviewQuery } from '@sharghigold/contracts';
import { describe, expect, it } from 'vitest';

import { getProductQuestions } from '@/server/catalogue/questions';
import { getReviewPage } from '@/server/catalogue/reviews';

const SLUG = 'classic-solitaire-ring';
const query = (over: Partial<ReviewQuery> = {}): ReviewQuery =>
  reviewQuerySchema.parse({ filter: 'all', sort: 'helpful', limit: 50, ...over });

describe('review listing', () => {
  it('matches the shared contract', async () => {
    const page = await getReviewPage(SLUG, query());

    expect(() => reviewPageSchema.parse(page)).not.toThrow();
  });

  it('filters on the server, and says how many the filter kept', async () => {
    const all = await getReviewPage(SLUG, query());
    const critical = await getReviewPage(SLUG, query({ filter: 'critical' }));

    expect(critical.reviews.every((review) => review.stars <= 3)).toBe(true);
    expect(critical.matched).toBe(critical.reviews.length);
    // `total` is the whole set whatever the filter, so the page can say «۱ از ۶».
    expect(critical.total).toBe(all.total);
    expect(critical.matched).toBeLessThan(all.matched);
  });

  it('understands every filter the URL can carry', async () => {
    const photos = await getReviewPage(SLUG, query({ filter: 'with-photos' }));
    const answered = await getReviewPage(SLUG, query({ filter: 'answered' }));
    const five = await getReviewPage(SLUG, query({ filter: 'five-star' }));

    expect(photos.reviews.every((review) => review.photos.length > 0)).toBe(true);
    expect(answered.reviews.every((review) => review.sellerReply !== null)).toBe(true);
    expect(five.reviews.every((review) => review.stars === 5)).toBe(true);
  });

  it('sorts by usefulness or by date, as asked', async () => {
    const helpful = await getReviewPage(SLUG, query({ sort: 'helpful' }));
    const newest = await getReviewPage(SLUG, query({ sort: 'newest' }));

    const counts = helpful.reviews.map((review) => review.helpfulCount);
    expect(counts).toEqual(counts.toSorted((a, b) => b - a));

    const dates = newest.reviews.map((review) => Date.parse(review.publishedAt));
    expect(dates).toEqual(dates.toSorted((a, b) => b - a));
  });

  it('truncates on the server, so a hidden review is never in the page', async () => {
    const page = await getReviewPage(SLUG, query({ limit: 2 }));

    expect(page.reviews).toHaveLength(2);
    expect(page.matched).toBeGreaterThan(2);
  });

  it('does not reorder the fixture it shares between requests', async () => {
    const first = await getReviewPage(SLUG, query({ sort: 'newest' }));
    await getReviewPage(SLUG, query({ sort: 'helpful' }));
    const again = await getReviewPage(SLUG, query({ sort: 'newest' }));

    // `sort` mutates. Sorting the stored array would let one request change
    // what the next one sees.
    expect(again.reviews.map((review) => review.id)).toEqual(
      first.reviews.map((review) => review.id),
    );
  });

  it('returns an empty page for a product with no reviews', async () => {
    const page = await getReviewPage('no-such-ring', query());

    expect(page.reviews).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.aspects).toEqual([]);
  });

  it('publishes only shortened display names', async () => {
    const page = await getReviewPage(SLUG, query());

    // «مریم ر.» and never «مریم رستمی»: the storefront is not sent a full name
    // to truncate, because a name that reaches the page can be read out of it.
    // The abbreviation runs to three letters, because a surname starting with
    // alef abbreviates to «الف.» rather than to a single character.
    for (const review of page.reviews) {
      expect(review.authorDisplayName).toMatch(/^\S+ \S{1,3}\.$/u);
    }
  });
});

describe('buyer questions', () => {
  it('puts answered questions first', async () => {
    const questions = await getProductQuestions(SLUG);
    const answered = questions.map((question) => question.answer !== null);

    expect(answered).toEqual(answered.toSorted((a, b) => Number(b) - Number(a)));
  });

  it('returns nothing for a product with no questions', async () => {
    expect(await getProductQuestions('no-such-ring')).toEqual([]);
  });
});
