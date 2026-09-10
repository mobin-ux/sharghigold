/**
 * One product, as a customer's product page needs it.
 *
 * Two rules shape this file.
 *
 * **It carries no price.** A product record holds what *determines* a price —
 * weight, purity, and the rates that apply to it — and the server derives the
 * figure from those with exact integer arithmetic every time it is asked. A
 * price that travelled as data could be edited in a request body, cached past
 * a rate change, or silently drift from the total an order is written against
 * (rules 5, 15 and 17). The computed figure has its own contract, in
 * `pricing.ts`.
 *
 * **It carries no presentation.** No colour values, no icon markup, no
 * pre-formatted Persian numerals. Those are decided by whoever edits a product
 * in the admin panel, and a `background:` or an `<svg>` chosen there would
 * render on every customer's page. What crosses the wire is keys and numbers;
 * the storefront owns the drawing, the swatch and the locale (rules 7 and 10).
 */
import { z } from 'zod';

import { basisPointsSchema, karatSchema, slugSchema, userTextSchema } from './primitives.js';

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The shop's own article number, printed on the invoice and the authenticity
 * label. Latin letters and digits so it survives being read down a phone.
 */
export const skuSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/, { message: 'کد کالا معتبر نیست' });

/**
 * A step in the «خانه › انگشتر › تک‌نگین» trail.
 *
 * `categorySlug` is null for the product itself, which is the last crumb and
 * is not a link. Nothing here carries an href: the storefront builds URLs, so
 * a crumb can never point somewhere the catalogue was allowed to choose.
 */
export const breadcrumbStepSchema = z.object({
  label: userTextSchema(40),
  categorySlug: slugSchema.nullable(),
});

export type BreadcrumbStep = z.output<typeof breadcrumbStepSchema>;

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One gallery frame.
 *
 * There is no URL yet — image hosting is not built — so a frame is an
 * identifier and the alternative text that describes it. When storage lands, a
 * `url` joins this object and the placeholder becomes the fallback rather than
 * the only state.
 *
 * `alt` is required and length-bounded because a gallery of undescribed
 * pictures is unusable on a screen reader, and «تصویر ۱» is not a description.
 */
export const productMediaSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'شناسه تصویر معتبر نیست' }),
  alt: userTextSchema(120),
});

export type ProductMedia = z.output<typeof productMediaSchema>;

/* -------------------------------------------------------------------------- */
/* Variants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The gold colours the workshop offers.
 *
 * A closed set, not a colour value. The storefront maps each key to a swatch
 * it owns; an API that sent `#D9A38C` would be choosing a CSS value that lands
 * in a style attribute on every product page.
 */
export const goldColourSchema = z.enum(['yellow', 'rose', 'white']);

export type GoldColour = z.output<typeof goldColourSchema>;

export const productColourSchema = z.object({
  colour: goldColourSchema,
  label: userTextSchema(24),
  available: z.boolean(),
});

export type ProductColour = z.output<typeof productColourSchema>;

/**
 * A ring size, as a plain number in the shop's own system.
 *
 * Sent as a number, rendered as «۵۲» by the storefront. Sending the Persian
 * spelling would make the value unusable for anything but display — it could
 * not be compared, sorted, or matched against stock.
 *
 * `available` is a hint for the interface and nothing more. Whether a size can
 * actually be ordered is decided when the order is placed, against stock the
 * server reads for itself; a disabled button is not an inventory control
 * (rules 15 and 17).
 */
export const productSizeSchema = z.object({
  value: z.int().min(1).max(200),
  available: z.boolean(),
});

export type ProductSize = z.output<typeof productSizeSchema>;

/**
 * A row of the size chart shown in the «راهنمای سایز» sheet.
 *
 * Circumference is an exact decimal string, never a float: it is displayed to
 * one decimal place, and a binary fraction rounds differently in different
 * places.
 */
export const sizeGuideRowSchema = z.object({
  size: z.int().min(1).max(200),
  circumferenceMillimetres: z
    .string()
    .regex(/^\d{1,3}(?:\.\d)?$/, { message: 'اندازه معتبر نیست' }),
});

export type SizeGuideRow = z.output<typeof sizeGuideRowSchema>;

/* -------------------------------------------------------------------------- */
/* Specification table                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A row of «مشخصات کالا».
 *
 * Free text on both sides because it genuinely is: عیار, نوع نگین and پهنای
 * رکاب share no vocabulary worth modelling, and inventing one would make
 * adding a specification a deploy.
 */
export const productSpecSchema = z.object({
  key: userTextSchema(40),
  value: userTextSchema(160),
});

export type ProductSpec = z.output<typeof productSpecSchema>;

/* -------------------------------------------------------------------------- */
/* Ratings                                                                    */
/* -------------------------------------------------------------------------- */

export const starRatingSchema = z.int().min(1).max(5);

/**
 * How many reviews gave each star rating.
 *
 * Counts, not percentages. The bar widths on the page are derived from these,
 * so the bars and the totals cannot disagree, and a caller that wants the mean
 * can compute it rather than trusting a number someone else rounded.
 */
export const ratingBucketSchema = z.object({
  stars: starRatingSchema,
  count: z.int().min(0),
});

export const ratingSummarySchema = z.object({
  /** Mean score to one decimal place, as an exact string: «4.8». */
  average: z.string().regex(/^[0-5](?:\.\d)?$/, { message: 'میانگین امتیاز معتبر نیست' }),
  total: z.int().min(0),
  /** Exactly one bucket per star value, five down to one. */
  buckets: z.array(ratingBucketSchema).length(5),
});

export type RatingSummary = z.output<typeof ratingSummarySchema>;

/* -------------------------------------------------------------------------- */
/* The product                                                                */
/* -------------------------------------------------------------------------- */

export const productDetailSchema = z.object({
  slug: slugSchema,
  sku: skuSchema,
  title: userTextSchema(120),
  /** The Latin name shown under the title. Null for most pieces. */
  latinTitle: z.string().trim().max(80).nullable(),
  breadcrumb: z.array(breadcrumbStepSchema).min(1).max(6),
  media: z.array(productMediaSchema).min(1).max(12),

  /* Pricing inputs. The figure itself is computed; see `pricing.ts`. */
  karat: karatSchema,
  /** Whole milligrams, as a string. `JSON.parse` would make this a double. */
  weightMilligrams: z.string().regex(/^\d+$/, { message: 'وزن باید عدد صحیح باشد' }),
  /** The ± tolerance in milligrams, printed on the invoice. */
  weightToleranceMilligrams: z.string().regex(/^\d+$/, { message: 'رواداری وزن معتبر نیست' }),
  makingFeeBasisPoints: basisPointsSchema,
  profitBasisPoints: basisPointsSchema,
  vatBasisPoints: basisPointsSchema,

  colours: z.array(productColourSchema).min(1).max(6),
  sizes: z.array(productSizeSchema).max(40),
  sizeGuide: z.array(sizeGuideRowSchema).max(40),

  specs: z.array(productSpecSchema).min(1).max(40),
  description: userTextSchema(2_000),

  rating: ratingSummarySchema,
  /** Completed orders. Social proof, not a stock figure. */
  unitsSold: z.int().min(0),
  inStock: z.boolean(),
  installmentEligible: z.boolean(),

  /** Slugs only. The storefront fetches and prices each one for itself. */
  relatedSlugs: z.array(slugSchema).max(12),
});

export type ProductDetail = z.output<typeof productDetailSchema>;
