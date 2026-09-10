import { describe, expect, it } from 'vitest';

import {
  contributionIdSchema,
  priceLineKindSchema,
  priceQuoteSchema,
  productColourSchema,
  productMediaSchema,
  productSizeSchema,
  questionSubmissionSchema,
  ratingSummarySchema,
  reviewQuerySchema,
  reviewSubmissionSchema,
  sizeGuideRowSchema,
  skuSchema,
} from '../index.js';

/* -------------------------------------------------------------------------- */
/* The product record                                                         */
/* -------------------------------------------------------------------------- */

describe('product contract', () => {
  const media = { id: 'front', alt: 'نمای اصلی انگشتر' };

  it('refuses an article number that is not one', () => {
    expect(skuSchema.safeParse('ZN-10482').success).toBe(true);
    expect(skuSchema.safeParse('zn-10482').success).toBe(false);
    expect(skuSchema.safeParse('ZN 10482').success).toBe(false);
    expect(skuSchema.safeParse('-ZN10482').success).toBe(false);
  });

  it('will not take a media id that could become a path', () => {
    expect(productMediaSchema.safeParse(media).success).toBe(true);
    expect(productMediaSchema.safeParse({ ...media, id: '../secret' }).success).toBe(false);
    expect(productMediaSchema.safeParse({ ...media, id: 'a/b' }).success).toBe(false);
  });

  it('insists a gallery frame is described', () => {
    // A picture with no alternative text is a picture a screen-reader user
    // cannot know is there.
    expect(productMediaSchema.safeParse({ id: 'front', alt: '' }).success).toBe(false);
    expect(productMediaSchema.safeParse({ id: 'front' }).success).toBe(false);
  });

  it('takes a gold colour as a key, never as a colour value', () => {
    const colour = { colour: 'rose', label: 'رزگلد', available: true };

    expect(productColourSchema.safeParse(colour).success).toBe(true);
    // A CSS value chosen in an admin form would land in a style attribute on
    // every customer's product page.
    expect(productColourSchema.safeParse({ ...colour, colour: '#D9A38C' }).success).toBe(false);
    expect(productColourSchema.safeParse({ ...colour, colour: 'var(--x)' }).success).toBe(false);
  });

  it('takes a ring size as a number, not as its Persian spelling', () => {
    expect(productSizeSchema.safeParse({ value: 54, available: true }).success).toBe(true);
    expect(productSizeSchema.safeParse({ value: '۵۴', available: true }).success).toBe(false);
  });

  it('holds a circumference as an exact decimal string', () => {
    const row = { size: 54, circumferenceMillimetres: '54.4' };

    expect(sizeGuideRowSchema.safeParse(row).success).toBe(true);
    expect(sizeGuideRowSchema.safeParse({ ...row, circumferenceMillimetres: 54.4 }).success).toBe(
      false,
    );
    expect(
      sizeGuideRowSchema.safeParse({ ...row, circumferenceMillimetres: '54.44' }).success,
    ).toBe(false);
  });

  it('wants one rating bucket per star, and a mean inside the scale', () => {
    const buckets = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 1 }));

    expect(ratingSummarySchema.safeParse({ average: '4.3', total: 5, buckets }).success).toBe(true);
    expect(
      ratingSummarySchema.safeParse({ average: '4.3', total: 5, buckets: buckets.slice(1) })
        .success,
    ).toBe(false);
    expect(ratingSummarySchema.safeParse({ average: '6.0', total: 5, buckets }).success).toBe(
      false,
    );
  });
});

/* -------------------------------------------------------------------------- */
/* The quote                                                                  */
/* -------------------------------------------------------------------------- */

describe('price quote contract', () => {
  const quote = {
    rate: {
      pricePerGramRials: '104800000',
      quotedKarat: 18,
      observedAt: '2026-08-03T09:00:00.000Z',
      isLive: false,
    },
    lines: [
      { kind: 'gold-value', amountRials: '293440000', basisPoints: null },
      { kind: 'making-fee', amountRials: '52819200', basisPoints: 1_800 },
      { kind: 'profit', amountRials: '24238144', basisPoints: 700 },
      { kind: 'vat', amountRials: '6935161', basisPoints: 900 },
    ],
    totalRials: '377432505',
    quotedAt: '2026-09-10T12:00:00.000Z',
    expiresAt: '2026-09-10T12:05:00.000Z',
    secondsRemaining: 300,
    plans: [{ months: 36, monthlyRials: '10484240' }],
  };

  it('accepts a well-formed quote', () => {
    expect(priceQuoteSchema.safeParse(quote).success).toBe(true);
  });

  it('refuses a quote that expired before it was struck', () => {
    expect(priceQuoteSchema.safeParse({ ...quote, expiresAt: quote.quotedAt }).success).toBe(false);
  });

  it('refuses an amount that arrived as a JSON number', () => {
    // `JSON.parse` turns a number into a double, and a double cannot hold a
    // rial total exactly. Amounts cross the wire as strings or not at all.
    expect(priceQuoteSchema.safeParse({ ...quote, totalRials: 377_432_505 }).success).toBe(false);
  });

  it('wants all four lines, and knows no others', () => {
    expect(priceQuoteSchema.safeParse({ ...quote, lines: quote.lines.slice(1) }).success).toBe(
      false,
    );
    expect(priceLineKindSchema.safeParse('shipping').success).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Reviews and questions                                                      */
/* -------------------------------------------------------------------------- */

describe('review contract', () => {
  const submission = {
    stars: 5,
    body: 'دقیقاً همان چیزی بود که در عکس دیده بودم و وزن آن با فاکتور می‌خواند.',
    aspects: [{ aspect: 'build-quality', stars: 5 }],
    acceptsPolicy: true,
  };

  it('accepts a complete submission', () => {
    expect(reviewSubmissionSchema.safeParse(submission).success).toBe(true);
  });

  it('refuses a review too short to tell anyone anything', () => {
    expect(reviewSubmissionSchema.safeParse({ ...submission, body: 'خوب بود' }).success).toBe(
      false,
    );
  });

  it('treats the publishing rules as a condition, not a preference', () => {
    // `false` is not a value to store: an unticked box means the review cannot
    // be published, so the schema refuses to carry one.
    expect(reviewSubmissionSchema.safeParse({ ...submission, acceptsPolicy: false }).success).toBe(
      false,
    );
  });

  it('refuses a star count outside the scale', () => {
    for (const stars of [0, 6, 4.5, '5']) {
      expect(
        reviewSubmissionSchema.safeParse({ ...submission, stars }).success,
        String(stars),
      ).toBe(false);
    }
  });

  it('defaults a missing filter and sort, but refuses an unknown one', () => {
    // These arrive from a URL, so they are attacker-chosen text. Parsing them
    // into an enum here is what stops one ever reaching a query.
    expect(reviewQuerySchema.parse({})).toEqual({ filter: 'all', sort: 'helpful', limit: 4 });
    expect(reviewQuerySchema.safeParse({ filter: "' OR 1=1--" }).success).toBe(false);
    expect(reviewQuerySchema.safeParse({ sort: 'rating; DROP TABLE reviews' }).success).toBe(false);
    expect(reviewQuerySchema.safeParse({ limit: 10_000 }).success).toBe(false);
  });

  it('strips control characters from a review body', () => {
    const bell = String.fromCharCode(7);
    const parsed = reviewSubmissionSchema.parse({
      ...submission,
      body: `${submission.body}${bell}`,
    });

    expect(parsed.body).toBe(submission.body);
  });

  it('will not take a contribution id that could become a path or an attribute', () => {
    expect(contributionIdSchema.safeParse('rv-10482-01').success).toBe(true);
    expect(contributionIdSchema.safeParse('../../etc').success).toBe(false);
    expect(contributionIdSchema.safeParse('-leading').success).toBe(false);
    expect(contributionIdSchema.safeParse('a b').success).toBe(false);
  });

  it('refuses a question too short to answer', () => {
    expect(questionSubmissionSchema.safeParse({ body: 'وزن؟' }).success).toBe(false);
    expect(
      questionSubmissionSchema.safeParse({ body: 'نگین این انگشتر قابل تعویض است؟' }).success,
    ).toBe(true);
  });
});
