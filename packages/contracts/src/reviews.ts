/**
 * Customer reviews and the buyer questions beside them.
 *
 * Both are user-generated, which makes this the contract that matters most for
 * safety on the product page. Three things follow from that.
 *
 * **Names are already shortened when they arrive.** The storefront never sees
 * a full name to truncate — «مریم ر.» is what the server stores for display.
 * Truncating in the browser would mean the whole name was sent to it, and a
 * name that reached the page can be read out of the HTML whatever the
 * component chose to render.
 *
 * **Nothing carries markup.** Bodies and titles are plain text, bounded and
 * stripped of control characters. React escapes what it renders, so this is
 * not the XSS defence — output encoding is — but a review body is the most
 * obvious place someone will try, and the shorter the accepted alphabet the
 * less there is to get wrong later in an email, an invoice or a PDF.
 *
 * **Filters and sorts are closed sets.** They arrive as query parameters, so
 * they are attacker-chosen text; parsing them into an enum here is what stops
 * a value ever reaching a query builder.
 */
import { z } from 'zod';

import { userTextSchema } from './primitives.js';
import { starRatingSchema } from './product.js';

/* -------------------------------------------------------------------------- */
/* Identifiers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A review or question id.
 *
 * Opaque and restricted to URL- and DOM-safe characters, because it becomes
 * both: an anchor a customer can link to, and the `id` an accordion or a
 * «helpful» button is wired to.
 */
export const contributionIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, { message: 'شناسه معتبر نیست' });

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The three things a buyer is asked to score separately.
 *
 * A closed set so the labels stay the storefront's, and so an average can be
 * computed per aspect across every product without matching on free text.
 */
export const reviewAspectSchema = z.enum(['build-quality', 'photo-match', 'value']);

export type ReviewAspect = z.output<typeof reviewAspectSchema>;

export const aspectScoreSchema = z.object({
  aspect: reviewAspectSchema,
  /** Mean for this aspect, to one decimal place: «4.9». */
  average: z.string().regex(/^[0-5](?:\.\d)?$/, { message: 'میانگین امتیاز معتبر نیست' }),
});

export type AspectScore = z.output<typeof aspectScoreSchema>;

/**
 * A photo attached to a review.
 *
 * No alternative text, deliberately. Customers do not write it, and inventing
 * one from the review body would put arbitrary user text into an `alt`
 * attribute. The storefront labels these as buyer photographs and counts them.
 */
export const reviewPhotoSchema = z.object({
  id: contributionIdSchema,
});

export const sellerReplySchema = z.object({
  body: userTextSchema(600),
  publishedAt: z.iso.datetime(),
});

export const productReviewSchema = z.object({
  id: contributionIdSchema,
  /** Already shortened for display by the server: «مریم ر.». */
  authorDisplayName: userTextSchema(40),
  stars: starRatingSchema,
  title: userTextSchema(80).nullable(),
  body: userTextSchema(600),
  publishedAt: z.iso.datetime(),
  /**
   * True only when the review is attached to a paid order for this product.
   * A badge that is not derived from an order is an advertisement.
   */
  verifiedPurchase: z.boolean(),
  photos: z.array(reviewPhotoSchema).max(6),
  helpfulCount: z.int().min(0),
  sellerReply: sellerReplySchema.nullable(),
});

export type ProductReview = z.output<typeof productReviewSchema>;

/* -------------------------------------------------------------------------- */
/* Reading the list                                                           */
/* -------------------------------------------------------------------------- */

export const reviewFilterSchema = z.enum([
  'all',
  'five-star',
  'with-photos',
  'critical',
  'answered',
]);

export type ReviewFilter = z.output<typeof reviewFilterSchema>;

export const reviewSortSchema = z.enum(['helpful', 'newest']);

export type ReviewSort = z.output<typeof reviewSortSchema>;

/**
 * What the reviews page asks for.
 *
 * Both fields default rather than fail on a missing value: this is a browsing
 * surface reached from links people share, and an unreadable page is a worse
 * answer to a stale URL than the default listing. A *present but unknown*
 * value is still a parse failure — silently accepting one would hide a bug.
 */
export const reviewQuerySchema = z.object({
  filter: reviewFilterSchema.default('all'),
  sort: reviewSortSchema.default('helpful'),
  limit: z.int().min(1).max(50).default(4),
});

export type ReviewQuery = z.output<typeof reviewQuerySchema>;

export const reviewPageSchema = z.object({
  reviews: z.array(productReviewSchema),
  /** Matching the filter, before `limit` was applied. */
  matched: z.int().min(0),
  /** Across the whole product, whatever the filter. */
  total: z.int().min(0),
  aspects: z.array(aspectScoreSchema).max(3),
});

export type ReviewPage = z.output<typeof reviewPageSchema>;

/* -------------------------------------------------------------------------- */
/* Writing one                                                                */
/* -------------------------------------------------------------------------- */

export const REVIEW_BODY_MIN = 20;
export const REVIEW_BODY_MAX = 600;

export const aspectRatingSchema = z.object({
  aspect: reviewAspectSchema,
  stars: starRatingSchema,
});

/**
 * A submitted review, exactly as the server must re-parse it.
 *
 * The form uses this schema too, so the messages a customer sees while typing
 * are the ones the server would give. That is a convenience and nothing more:
 * the browser's copy of a rule is a hint, and every field is parsed again on
 * arrival before anything is stored (rules 6 and 9).
 *
 * `acceptsPolicy` is a literal `true` rather than a boolean. A checkbox that
 * must be ticked is not a preference, and `false` is not a value to record.
 */
export const reviewSubmissionSchema = z.object({
  stars: starRatingSchema,
  title: userTextSchema(80).optional(),
  body: userTextSchema(REVIEW_BODY_MAX).refine((value) => value.length >= REVIEW_BODY_MIN, {
    message: 'متن دیدگاه باید حداقل ۲۰ نویسه باشد',
  }),
  aspects: z.array(aspectRatingSchema).max(3),
  acceptsPolicy: z.literal(true, { message: 'پذیرش قواعد انتشار دیدگاه لازم است' }),
});

export type ReviewSubmission = z.output<typeof reviewSubmissionSchema>;

/* -------------------------------------------------------------------------- */
/* Questions                                                                  */
/* -------------------------------------------------------------------------- */

export const questionAnswerSchema = z.object({
  body: userTextSchema(800),
  /** Who answered: a shop expert, or another buyer. */
  author: userTextSchema(40),
  answeredAt: z.iso.datetime(),
});

export const productQuestionSchema = z.object({
  id: contributionIdSchema,
  body: userTextSchema(400),
  askedByDisplayName: userTextSchema(40),
  askedAt: z.iso.datetime(),
  answer: questionAnswerSchema.nullable(),
  helpfulCount: z.int().min(0),
});

export type ProductQuestion = z.output<typeof productQuestionSchema>;

export const QUESTION_BODY_MIN = 10;
export const QUESTION_BODY_MAX = 400;

export const questionSubmissionSchema = z.object({
  body: userTextSchema(QUESTION_BODY_MAX).refine((value) => value.length >= QUESTION_BODY_MIN, {
    message: 'پرسش خود را کامل‌تر بنویسید',
  }),
});

export type QuestionSubmission = z.output<typeof questionSubmissionSchema>;
