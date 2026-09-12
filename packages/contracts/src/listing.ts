/**
 * The product listing: what a customer may ask a grid of products to show, and
 * what comes back.
 *
 * Every filter on this page arrives as query-string text — from a facet tile,
 * from a sort menu, from somebody editing the URL bar. So the request half of
 * this file is a parser, not a type: it coerces, it bounds, and it discards
 * anything it does not recognise rather than passing it through to whatever
 * runs the query. A listing is the widest untrusted surface a shop has, and
 * `?sort=price;DROP` has to be a sort that does not exist rather than a string
 * that reaches a database.
 *
 * The response half carries prices, because the server computed them. What it
 * does not carry is anything the client could send back as an authority: a
 * card names a slug, and adding it to a basket sends that slug and nothing
 * else.
 */
import { z } from 'zod';

import {
  karatSchema,
  milligramsStringSchema,
  rialsStringSchema,
  slugSchema,
  userTextSchema,
} from './primitives.js';
import { goldColourSchema } from './product.js';

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The orderings the listing offers.
 *
 * A closed set, because each one names a column the catalogue can actually
 * order by and a label the storefront prints. An unrecognised value falls back
 * to the default rather than failing the page — a customer following a stale
 * link wants a listing, not an error.
 */
export const productSortSchema = z.enum([
  /** Newest listing date first. The default for «نو رسیده‌ها». */
  'newest',
  /** Most units sold first. */
  'best-selling',
  'price-asc',
  'price-desc',
  'weight-asc',
  'weight-desc',
]);

export type ProductSort = z.output<typeof productSortSchema>;

export const DEFAULT_PRODUCT_SORT: ProductSort = 'best-selling';

/* -------------------------------------------------------------------------- */
/* The request                                                                */
/* -------------------------------------------------------------------------- */

/** How many products a listing page shows. Bounded so a URL cannot ask for all. */
export const LISTING_PAGE_SIZE = 12;

/** The most pages a listing will offer, so `?page=9999999` is not a table scan. */
export const LISTING_MAX_PAGE = 200;

/**
 * A flag that arrives as `1`, `true` or `on` and means nothing else.
 *
 * Written out rather than `z.coerce.boolean()`, which treats the string
 * `'false'` as true — every non-empty string is truthy — and would turn
 * `?discounted=false` into a discount filter.
 */
const flagSchema = z
  .enum(['1', 'true', 'on', '0', 'false', 'off'])
  .transform((value) => value === '1' || value === 'true' || value === 'on');

/**
 * The search term.
 *
 * Bounded hard and stripped of control characters by `userTextSchema`. It is
 * matched against titles the catalogue already holds and is never interpolated
 * into anything — the storefront's search is a substring comparison, and the
 * database implementation will bind it as a parameter.
 */
export const searchTermSchema = userTextSchema(80);

export const listingQuerySchema = z.object({
  /** A taxonomy slug. Sub-types widen to their parent category. */
  category: slugSchema.optional(),
  q: searchTermSchema.optional(),
  /** Inclusive bounds, in whole rials. */
  minPriceRials: rialsStringSchema.optional(),
  maxPriceRials: rialsStringSchema.optional(),
  /** Inclusive bounds, in whole milligrams. */
  minWeightMg: milligramsStringSchema.optional(),
  maxWeightMg: milligramsStringSchema.optional(),
  karat: karatSchema.optional(),
  colour: goldColourSchema.optional(),
  /** A curated collection, e.g. `weekly-sale`. */
  collection: slugSchema.optional(),
  /** Only pieces whose making fee is currently reduced. */
  discounted: z.boolean().default(false),
  /** Only pieces offered on an instalment plan. */
  installment: z.boolean().default(false),
  /** Only pieces the shop can ship today. */
  inStock: z.boolean().default(false),
  sort: productSortSchema.default(DEFAULT_PRODUCT_SORT),
  page: z.int().min(1).max(LISTING_MAX_PAGE).default(1),
});

export type ListingQuery = z.output<typeof listingQuerySchema>;

/**
 * An unfiltered listing: no category, no search, default sort, first page.
 *
 * Exported so that a caller building a query in code — a homepage rail, a
 * test — starts from the same defaults the parser applies, rather than
 * restating them and eventually restating one of them differently.
 */
export const DEFAULT_LISTING_QUERY: ListingQuery = listingQuerySchema.parse({});

/** Keep a value only if it parses; otherwise behave as if it was not sent. */
function keep<T>(schema: z.ZodType<T>, raw: string | undefined): T | undefined {
  if (raw === undefined) return undefined;
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Parse a listing request out of raw query-string values.
 *
 * `searchParams` is whatever the URL contained: missing keys, repeated keys
 * (which arrive as arrays), and values of any shape. Every field is handled
 * the same way — take the first value, try it, and drop it if it does not
 * parse. A bad `maxPrice` narrows nothing rather than failing the page,
 * because a listing that 500s on a malformed URL is a listing that anyone can
 * take down with a link.
 *
 * The one thing that is *not* lenient is the shape of what comes out: the
 * result is always a fully-defaulted `ListingQuery`, so no caller has to ask
 * whether a filter was present.
 */
export function parseListingQuery(
  searchParams: Readonly<Record<string, string | readonly string[] | undefined>>,
): ListingQuery {
  const first = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : (value as string | undefined);
  };

  const pageRaw = keep(z.coerce.number().int().min(1).max(LISTING_MAX_PAGE), first('page'));

  const candidate = {
    category: keep(slugSchema, first('category')),
    q: keep(searchTermSchema, first('q')),
    minPriceRials: keep(rialsStringSchema, first('minPrice')),
    maxPriceRials: keep(rialsStringSchema, first('maxPrice')),
    minWeightMg: keep(milligramsStringSchema, first('minWeightMg')),
    maxWeightMg: keep(milligramsStringSchema, first('maxWeightMg')),
    karat: keep(z.coerce.number().pipe(karatSchema), first('karat')),
    colour: keep(goldColourSchema, first('colour')),
    collection: keep(slugSchema, first('collection')),
    discounted: keep(flagSchema, first('discounted')) ?? false,
    installment: keep(flagSchema, first('installment')) ?? false,
    inStock: keep(flagSchema, first('inStock')) ?? false,
    sort: keep(productSortSchema, first('sort')) ?? DEFAULT_PRODUCT_SORT,
    page: pageRaw ?? 1,
  };

  // Everything above already passed its own schema, so this cannot fail; it
  // runs anyway because the defaults live in the schema and applying them
  // twice, by hand, is how the two copies get to disagree.
  return listingQuerySchema.parse(candidate);
}

/* -------------------------------------------------------------------------- */
/* The response                                                               */
/* -------------------------------------------------------------------------- */

/**
 * One card in the grid.
 *
 * Prices are already formatted Persian strings, because the arithmetic is
 * `bigint` rials that cannot cross into a client component without becoming a
 * double. `discountPercent` is derived from the two totals rather than
 * asserted, so the badge and the figures can never disagree.
 */
export const productSummarySchema = z.object({
  slug: slugSchema,
  title: userTextSchema(120),
  /** The category's own name, for the card's second line. */
  categoryTitle: userTextSchema(40),
  /** «۱۸ عیار», «۲٫۸ گرم» — rendered as separate elements, never joined. */
  specs: z.array(userTextSchema(24)).max(4),
  /** Grouped Persian digits, no unit. The card renders «تومان» itself. */
  price: z.string().min(1).max(32),
  /** The pre-offer figure, when the making fee is reduced. */
  wasPrice: z.string().min(1).max(32).nullable(),
  discountPercent: z.int().min(1).max(99).nullable(),
  installment: z.boolean(),
  inStock: z.boolean(),
});

export type ProductSummary = z.output<typeof productSummarySchema>;

export const productListingSchema = z.object({
  items: z.array(productSummarySchema),
  /** Matches before paging, so the page can say «۲۴ محصول». */
  total: z.int().min(0),
  page: z.int().min(1),
  pageCount: z.int().min(0),
  /** How many filters are narrowing this listing, for the «حذف فیلترها» chip. */
  activeFilterCount: z.int().min(0),
});

export type ProductListing = z.output<typeof productListingSchema>;
