/**
 * The product listing: one query, one grid.
 *
 * `/products`, `/categories/:slug` and `/search` are three URLs onto this one
 * function. They differ in what they pre-set and what they call themselves,
 * and in nothing else — which is the point. A search that filtered differently
 * from a category listing would be two implementations of «which products
 * match», and the second one is where the out-of-stock piece reappears.
 *
 * Everything a customer can say arrives as query-string text and has already
 * been through `parseListingQuery` before it reaches here, so this module
 * works entirely in parsed values. Nothing below interpolates a filter into
 * anything; when the source is a database, each of these comparisons becomes a
 * bound parameter and the shape of the function does not change.
 *
 * Prices are computed here, at the current rate, rather than stored. A
 * starting price that was typed in once is a starting price that is wrong the
 * next time gold moves.
 *
 * Server-only. Nothing here may reach a client bundle: it prices in `bigint`
 * rials, which cannot cross that boundary without becoming a double.
 */
import {
  DEFAULT_LISTING_QUERY,
  DEFAULT_PRODUCT_SORT,
  LISTING_PAGE_SIZE,
  type ListingQuery,
  type ProductSummary,
  type ProductListing,
} from '@sharghigold/contracts';
import {
  formatGrams,
  formatToman,
  gramsToMilligrams,
  pricePerGramForKarat,
  quoteGoldPrice,
  toPersianDigits,
  type Milligrams,
  type Rials,
} from '@sharghigold/money';

import { getGoldRate } from '@/lib/gold-price';
import type { ProductListingSource } from '@/server/ports';

import { categoryTitle, getCategoryNavigation, resolveCategory } from './navigation';
import {
  PRODUCT_FIXTURES,
  PROFIT_BASIS_POINTS,
  VAT_BASIS_POINTS,
  type ProductFixture,
} from './products';

/* -------------------------------------------------------------------------- */
/* Pricing                                                                    */
/* -------------------------------------------------------------------------- */

/** What a piece costs now, and what it cost before the offer. */
interface Priced {
  readonly fixture: ProductFixture;
  readonly weightMilligrams: Milligrams;
  readonly total: Rials;
  /** Undefined unless the making fee is currently reduced. */
  readonly was: Rials | undefined;
}

function quote(fixture: ProductFixture, makingFeeBasisPoints: number): Rials {
  const rate = getGoldRate();

  return quoteGoldPrice({
    pricePerGram: pricePerGramForKarat(rate.pricePerGram18k, rate.quotedKarat, fixture.karat),
    weight: gramsToMilligrams(fixture.grams),
    makingFeeBasisPoints,
    profitBasisPoints: PROFIT_BASIS_POINTS,
    vatBasisPoints: VAT_BASIS_POINTS,
  }).total;
}

function price(fixture: ProductFixture): Priced {
  const promotional = fixture.promotionalMakingFeeBasisPoints;

  return {
    fixture,
    weightMilligrams: gramsToMilligrams(fixture.grams),
    total: quote(fixture, promotional ?? fixture.makingFeeBasisPoints),
    was: promotional === undefined ? undefined : quote(fixture, fixture.makingFeeBasisPoints),
  };
}

/**
 * Percentage off, floored, in integer arithmetic.
 *
 * Floored rather than rounded: a customer told «۱۵٪» who computes 14.6% has
 * been overpromised, and the difference is not the shop's to round in its own
 * favour.
 */
function discountPercent(was: Rials, now: Rials): number | null {
  if (was <= now) return null;
  const percent = ((was - now) * 100n) / was;
  return percent === 0n ? null : Number(percent);
}

/* -------------------------------------------------------------------------- */
/* The card                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A priced piece as a grid card: text, and nothing else.
 *
 * Nothing in this object can be arithmetic'd by mistake, and nothing in it can
 * be sent back to the server as an authority on what something costs — when an
 * order is placed the price is quoted again from the weight and the rate, and
 * the client's opinion is discarded.
 */
export function toCard(priced: Priced): ProductSummary {
  const { fixture } = priced;

  return {
    slug: fixture.slug,
    title: fixture.title,
    categoryTitle: categoryTitle(fixture.categorySlug) ?? '',
    specs: [`${toPersianDigits(String(fixture.karat))} عیار`, formatGrams(priced.weightMilligrams)],
    price: formatToman(priced.total, { withUnit: false }),
    wasPrice: priced.was === undefined ? null : formatToman(priced.was, { withUnit: false }),
    discountPercent: priced.was === undefined ? null : discountPercent(priced.was, priced.total),
    installment: fixture.installmentEligible,
    inStock: fixture.inStock,
  };
}

/* -------------------------------------------------------------------------- */
/* Matching                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Does this piece belong under the requested taxonomy slug?
 *
 * A top-level slug matches the whole category; a sub-type slug matches only
 * the pieces filed under that tile. The caller has already turned the URL into
 * one or the other, so nothing here has to know which tiles exist.
 */
function inCategory(fixture: ProductFixture, categorySlug: string, isSubType: boolean): boolean {
  return isSubType ? fixture.subTypeSlug === categorySlug : fixture.categorySlug === categorySlug;
}

/**
 * Does the search term appear in anything a customer would search by?
 *
 * Title, Latin title and article number. Case-folded, and matched as a plain
 * substring — this is a fixture catalogue, and the database implementation
 * replaces it with a full-text index rather than with a cleverer loop here.
 */
function matchesTerm(fixture: ProductFixture, term: string): boolean {
  const needle = term.toLocaleLowerCase('fa-IR');

  return [fixture.title, fixture.latinTitle ?? '', fixture.sku, fixture.description].some((field) =>
    field.toLocaleLowerCase('fa-IR').includes(needle),
  );
}

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A total order, so paging is stable.
 *
 * Every comparator falls back to the slug. Without that, two pieces with the
 * same weight can swap places between page one and page two and one of them is
 * shown twice while the other is never shown at all.
 */
const COMPARATORS: Record<ListingQuery['sort'], (a: Priced, b: Priced) => number> = {
  newest: (a, b) => b.fixture.listedAt.localeCompare(a.fixture.listedAt),
  'best-selling': (a, b) => b.fixture.unitsSold - a.fixture.unitsSold,
  'price-asc': (a, b) => compareBigInt(a.total, b.total),
  'price-desc': (a, b) => compareBigInt(b.total, a.total),
  'weight-asc': (a, b) => compareBigInt(a.weightMilligrams, b.weightMilligrams),
  'weight-desc': (a, b) => compareBigInt(b.weightMilligrams, a.weightMilligrams),
};

/** `Array.prototype.sort` wants a number, and a bigint difference is a bigint. */
function compareBigInt(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/* -------------------------------------------------------------------------- */
/* The listing                                                                */
/* -------------------------------------------------------------------------- */

/**
 * How many of the query's filters are actually narrowing the result.
 *
 * Drives the «حذف فیلترها» affordance, and is why `sort` and `page` are not
 * counted: neither hides a product, so offering to clear them would be
 * offering to change the order of a list nobody asked to reorder.
 */
function countFilters(query: ListingQuery): number {
  const narrowing = [
    query.q,
    query.minPriceRials,
    query.maxPriceRials,
    query.minWeightMg,
    query.maxWeightMg,
    query.karat,
    query.colour,
    query.collection,
  ].filter((value) => value !== undefined).length;

  return (
    narrowing + (query.discounted ? 1 : 0) + (query.installment ? 1 : 0) + (query.inStock ? 1 : 0)
  );
}

/**
 * Every product matching a query, priced, sorted and paged.
 *
 * Async because the real implementation will be. Keeping the signature
 * promise-shaped now means adding the network call later is not a change that
 * ripples through three routes.
 *
 * A `category` the taxonomy does not contain matches nothing rather than
 * matching everything. The other direction — an unknown filter widening the
 * result — is how a typo in a facet tile quietly lists the whole shop.
 */
export async function listProducts(requested: Partial<ListingQuery>): Promise<ProductListing> {
  // Routes pass a parsed query, which is already complete; a homepage rail
  // passes two fields. Merging with the contract's own defaults means neither
  // caller restates them, and the two cannot drift.
  const query: ListingQuery = { ...DEFAULT_LISTING_QUERY, ...requested };

  const resolved =
    query.category === undefined
      ? undefined
      : resolveCategory(await getCategoryNavigation(), query.category);

  if (query.category !== undefined && resolved === undefined) {
    return { items: [], total: 0, page: 1, pageCount: 0, activeFilterCount: countFilters(query) };
  }

  const matched = PRODUCT_FIXTURES.filter((fixture) => {
    if (resolved !== undefined && !inCategory(fixture, resolved.slug, resolved.isSubType)) {
      return false;
    }
    if (query.q !== undefined && !matchesTerm(fixture, query.q)) return false;
    if (query.karat !== undefined && fixture.karat !== query.karat) return false;
    if (query.colour !== undefined) {
      const offered = fixture.colours.some(
        (colour) => colour.colour === query.colour && colour.available,
      );
      if (!offered) return false;
    }
    if (query.collection !== undefined && !fixture.collections.includes(query.collection)) {
      return false;
    }
    if (query.discounted && fixture.promotionalMakingFeeBasisPoints === undefined) return false;
    if (query.installment && !fixture.installmentEligible) return false;
    if (query.inStock && !fixture.inStock) return false;

    const weight = gramsToMilligrams(fixture.grams);
    if (query.minWeightMg !== undefined && weight < BigInt(query.minWeightMg)) return false;
    if (query.maxWeightMg !== undefined && weight > BigInt(query.maxWeightMg)) return false;

    return true;
  }).map(price);

  // Price bands are applied after pricing, because a price is not stored: it
  // is the gold rate times the weight plus the fees, and it moves.
  const withinPrice = matched.filter((priced) => {
    if (query.minPriceRials !== undefined && priced.total < BigInt(query.minPriceRials)) {
      return false;
    }
    if (query.maxPriceRials !== undefined && priced.total > BigInt(query.maxPriceRials)) {
      return false;
    }
    return true;
  });

  const comparator = COMPARATORS[query.sort] ?? COMPARATORS[DEFAULT_PRODUCT_SORT];
  const ordered = withinPrice.toSorted(
    (a, b) => comparator(a, b) || a.fixture.slug.localeCompare(b.fixture.slug),
  );

  const total = ordered.length;
  const pageCount = Math.ceil(total / LISTING_PAGE_SIZE);
  // A page past the end shows nothing rather than clamping to the last page.
  // Clamping makes `?page=99` and `?page=3` the same URL with different
  // content, which is the thing a crawler penalises.
  const start = (query.page - 1) * LISTING_PAGE_SIZE;

  return {
    items: ordered.slice(start, start + LISTING_PAGE_SIZE).map(toCard),
    total,
    page: query.page,
    pageCount,
    activeFilterCount: countFilters(query),
  };
}

/**
 * A fixed set of slugs, priced as cards, in the order given.
 *
 * The homepage rails are curated — «نو رسیده‌ها» is not simply the six newest
 * pieces — so they name what they show. A slug with no product is skipped
 * rather than rendering a card that leads nowhere, which is exactly the bug
 * this module was built to end.
 */
export async function cardsForSlugs(slugs: readonly string[]): Promise<readonly ProductSummary[]> {
  const bySlug = new Map(PRODUCT_FIXTURES.map((fixture) => [fixture.slug, fixture]));

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((fixture): fixture is ProductFixture => fixture !== undefined)
    .map((fixture) => toCard(price(fixture)));
}

/** Every distinct category title in the catalogue, for the homepage chips. */
export async function catalogueCategoryTitles(): Promise<readonly string[]> {
  const seen = new Set<string>();

  for (const fixture of PRODUCT_FIXTURES) {
    const title = categoryTitle(fixture.categorySlug);
    if (title !== undefined) seen.add(title);
  }

  return [...seen];
}

/** Conformance with the port, checked by the compiler. See `server/ports.ts`. */
export const LISTING_PORT = { listProducts, cardsForSlugs } satisfies ProductListingSource;
