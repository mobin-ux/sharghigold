/**
 * Turning a listing query into the URLs and the Persian labels a grid needs.
 *
 * Every control on a listing ends in a URL: a sort, a quick filter, «load more»
 * and the filter sheet's «show results» all point at the same page with some
 * parameters changed. The sheet holds a draft while it is open, but what it
 * applies is a link like any other, so every view is shareable, crawlable and
 * restorable from history. A filter that lives only in component state is a
 * description of what is painted rather than of what was sent.
 *
 * Browser-safe: the filter sheet builds its destination with the same
 * `listingHref` the server renders with, so the two cannot disagree about what
 * a filter is called in the URL.
 */
import {
  DEFAULT_PRODUCT_SORT,
  type CategoryNavigationEntry,
  type Karat,
  type ListingQuery,
  type ProductSort,
} from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';

/* -------------------------------------------------------------------------- */
/* Building the URL                                                           */
/* -------------------------------------------------------------------------- */

/** A change to the current query. `null` clears a filter. */
export type ListingPatch = {
  readonly [K in keyof ListingQuery]?: ListingQuery[K] | null;
};

/**
 * Default values are not written into the URL.
 *
 * Two URLs that show the same grid should be the same URL — otherwise the page
 * a customer arrived on and the one «حذف فیلترها» leads to are different
 * addresses for one page, which is what a crawler penalises.
 */
const OMITTED: Readonly<Record<string, unknown>> = {
  sort: DEFAULT_PRODUCT_SORT,
  page: 1,
  discounted: false,
  installment: false,
  inStock: false,
  freeShipping: false,
};

/** Query-string names, which differ from the parsed field names for money. */
const PARAM: Readonly<Record<string, string>> = {
  minPriceRials: 'minPrice',
  maxPriceRials: 'maxPrice',
};

/**
 * Where a control on a listing points.
 *
 * `basePath` already carries the category for `/categories/:slug`, so the
 * category is never written into the query as well — one page, one address.
 */
export function listingHref(
  basePath: string,
  query: ListingQuery,
  patch: ListingPatch = {},
): string {
  const merged: Record<string, unknown> = { ...query, ...patch };
  const params = new URLSearchParams();

  for (const [field, value] of Object.entries(merged)) {
    if (field === 'category') continue;
    if (value === undefined || value === null || value === '') continue;
    if (OMITTED[field] === value) continue;

    params.set(PARAM[field] ?? field, value === true ? '1' : String(value));
  }

  const search = params.toString();
  return search === '' ? basePath : `${basePath}?${search}`;
}

/** Every narrowing filter dropped; the search term and the order kept. */
export const CLEAR_FILTERS: ListingPatch = {
  minPriceRials: null,
  maxPriceRials: null,
  minWeightMg: null,
  maxWeightMg: null,
  karat: null,
  colour: null,
  collection: null,
  discounted: false,
  installment: false,
  inStock: false,
  freeShipping: false,
  page: 1,
};

/**
 * The same URL with every filter dropped.
 *
 * The search term survives. On `/search` it is the page itself rather than a
 * filter on it, and «remove filters» that also forgot what you searched for
 * would be a second, surprising action behind one button.
 */
export function clearedHref(basePath: string, query: ListingQuery): string {
  return listingHref(basePath, query, CLEAR_FILTERS);
}

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

/** What each ordering is called, including the ones the sheet does not offer. */
export const SORT_LABEL: Readonly<Record<ProductSort, string>> = {
  newest: 'جدیدترین',
  'best-selling': 'پرفروش‌ترین',
  'price-asc': 'ارزان‌ترین',
  'price-desc': 'گران‌ترین',
  'discount-desc': 'بیشترین تخفیف',
  'weight-asc': 'سبک‌ترین',
  'weight-desc': 'سنگین‌ترین',
};

/**
 * The orderings the sort sheet offers, in the canvas's order.
 *
 * The two weight orderings are still accepted from a URL — links to them exist
 * — and the sort button names them when they are active; the sheet simply
 * does not offer them.
 */
export const SORT_OPTIONS: readonly ProductSort[] = [
  'newest',
  'best-selling',
  'price-asc',
  'price-desc',
  'discount-desc',
];

/* -------------------------------------------------------------------------- */
/* Quick filters                                                              */
/* -------------------------------------------------------------------------- */

export type QuickFilterField = 'inStock' | 'installment' | 'discounted' | 'freeShipping';

/** The chips under the filter and sort buttons. Each toggles one flag. */
export const QUICK_FILTERS: readonly {
  readonly field: QuickFilterField;
  readonly label: string;
}[] = [
  { field: 'inStock', label: 'موجود' },
  { field: 'installment', label: 'خرید اقساطی' },
  { field: 'discounted', label: 'تخفیف‌دار' },
  { field: 'freeShipping', label: 'ارسال رایگان' },
];

/* -------------------------------------------------------------------------- */
/* The filter sheet                                                           */
/* -------------------------------------------------------------------------- */

/** A sub-type the sheet can narrow to. Selecting one changes the path. */
export interface ModelOption {
  readonly label: string;
  readonly slug: string;
  readonly basePath: string;
  /** The mark the category browser draws for this sub-type. */
  readonly icon: string | null;
}

/** A weight band, as the milligram bounds it writes into the query. */
export interface WeightBand {
  readonly label: string;
  readonly minWeightMg: string | null;
  readonly maxWeightMg: string | null;
}

export interface ListingFacets {
  /** The category the listing belongs to. Null on `/products` and `/search`. */
  readonly categorySlug: string | null;
  /** Where «all models» points: the category itself. Null off a category. */
  readonly categoryPath: string | null;
  readonly models: readonly ModelOption[];
  readonly weightBands: readonly WeightBand[];
  readonly karats: readonly Karat[];
}

/** The purities the sheet offers. 22 is valid in a URL but not stocked. */
export const KARAT_OPTIONS: readonly Karat[] = [18, 21, 24];

export const NO_FACETS: ListingFacets = {
  categorySlug: null,
  categoryPath: null,
  models: [],
  weightBands: [],
  karats: KARAT_OPTIONS,
};

/**
 * The sheet's options for one category, read from the taxonomy.
 *
 * Nothing here is written out a second time: the models are the category's
 * sub-type tiles and the weight bands are its weight tiles, so a merchandiser
 * who changes a band in the taxonomy changes the browser and the sheet at once.
 * `pathFor` is passed in so this module does not decide what a category URL
 * looks like — `lib/routes.ts` does.
 */
export function categoryFacets(
  category: CategoryNavigationEntry,
  pathFor: (slug: string) => string,
): ListingFacets {
  const tilesOf = (kind: string) =>
    category.groups.find((group) => group.kind === kind)?.tiles ?? [];

  return {
    categorySlug: category.slug,
    categoryPath: pathFor(category.slug),
    models: tilesOf('models')
      .filter((tile) => tile.slug !== category.slug)
      .map((tile) => ({
        label: tile.label,
        slug: tile.slug,
        basePath: pathFor(tile.slug),
        icon: tile.icon,
      })),
    weightBands: tilesOf('weight')
      .filter((tile) => tile.slug === category.slug && Object.keys(tile.query).length > 0)
      .map((tile) => ({
        label: tile.label,
        minWeightMg: tile.query['minWeightMg'] ?? null,
        maxWeightMg: tile.query['maxWeightMg'] ?? null,
      })),
    karats: KARAT_OPTIONS,
  };
}

/** The weight bounds a query carries, in the shape a band has. */
export type WeightBounds = Pick<WeightBand, 'minWeightMg' | 'maxWeightMg'>;

export function weightOf(query: ListingQuery): WeightBounds | null {
  if (query.minWeightMg === undefined && query.maxWeightMg === undefined) return null;
  return { minWeightMg: query.minWeightMg ?? null, maxWeightMg: query.maxWeightMg ?? null };
}

export function sameWeight(a: WeightBounds | null, b: WeightBounds | null): boolean {
  return a?.minWeightMg === b?.minWeightMg && a?.maxWeightMg === b?.maxWeightMg;
}

/**
 * The maximum-price slider, in millions of toman.
 *
 * The top of the range means «no limit», not «140 million»: a slider left
 * where it started must not quietly hide the pieces that cost more.
 */
export const PRICE_SLIDER = { min: 10, max: 140, step: 5 } as const;

const RIALS_PER_MILLION_TOMAN = 10_000_000n;

/** A slider position as the rials the query carries, or null at the top. */
export function sliderToRials(millions: number): string | null {
  if (millions >= PRICE_SLIDER.max) return null;
  return (
    BigInt(Math.max(PRICE_SLIDER.min, Math.trunc(millions))) * RIALS_PER_MILLION_TOMAN
  ).toString();
}

/** The query's price cap as a slider position, snapped to the step. */
export function rialsToSlider(maxPriceRials: string | undefined): number {
  if (maxPriceRials === undefined) return PRICE_SLIDER.max;
  const millions = Number(BigInt(maxPriceRials) / RIALS_PER_MILLION_TOMAN);
  const snapped = Math.floor(millions / PRICE_SLIDER.step) * PRICE_SLIDER.step;
  return Math.min(PRICE_SLIDER.max, Math.max(PRICE_SLIDER.min, snapped));
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

export function karatLabel(karat: Karat): string {
  return `${toPersianDigits(String(karat))} عیار`;
}

/** «۲۴ کالا». */
export function countLabel(total: number): string {
  return `${toPersianDigits(String(total))} کالا`;
}

/** A slider position in full toman, grouped: «۱۴۰٬۰۰۰٬۰۰۰». */
export function sliderAmountLabel(millions: number): string {
  const toman = BigInt(millions) * 1_000_000n;
  return toPersianDigits(toman.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
}

export interface EmptyCopy {
  readonly title: string;
  readonly text: string;
  /** Whether «حذف همه فیلترها» would change anything. */
  readonly canClear: boolean;
}

/**
 * What an empty grid says.
 *
 * Different when a filter is on, because the two situations have different
 * answers: «there is nothing here» is a dead end, and «your filters found
 * nothing» has a button.
 */
export function emptyCopy(query: ListingQuery, activeFilterCount: number): EmptyCopy {
  if (activeFilterCount > 0) {
    return {
      title: 'کالایی با این فیلترها پیدا نشد',
      text: 'یکی از فیلترها را بردارید تا نتیجه‌های بیشتری ببینید.',
      canClear: true,
    };
  }
  if (query.q !== undefined) {
    return {
      title: `برای «${query.q}» کالایی پیدا نشد`,
      text: 'املای عبارت را بررسی کنید یا دسته‌بندی‌ها را مرور کنید.',
      canClear: false,
    };
  }
  return {
    title: 'در این دسته هنوز کالایی نیست',
    text: 'به‌زودی کالاهای تازه به این دسته اضافه می‌شوند.',
    canClear: false,
  };
}
