/**
 * Turning a listing query into the URLs and the Persian labels a grid needs.
 *
 * The listing has no client JavaScript at all: every control on it is a link
 * whose destination is the same page with one parameter changed. That is the
 * idiom the review list already uses, and it is right for the same reasons —
 * every view is shareable, crawlable, restorable from history, and works
 * before hydration. A filter that lives in component state is a description of
 * what is painted rather than of what was sent.
 *
 * So this module is mostly one function: given where we are and what should
 * change, where does that control point?
 */
import type { ListingQuery, ProductSort } from '@sharghigold/contracts';
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
 * Two URLs that show the same grid should be the same URL — otherwise the
 * «همه» chip and the page a customer arrived on are different addresses for
 * one page, which is what a crawler penalises and what makes «is this filter
 * on?» ambiguous.
 */
const OMITTED: Readonly<Record<string, unknown>> = {
  sort: 'best-selling',
  page: 1,
  discounted: false,
  installment: false,
  inStock: false,
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

/** The same URL with every narrowing filter dropped, keeping the order. */
export function clearedHref(basePath: string, query: ListingQuery): string {
  return listingHref(basePath, query, {
    q: null,
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
    page: 1,
  });
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

export const SORT_OPTIONS: readonly { readonly id: ProductSort; readonly label: string }[] = [
  { id: 'best-selling', label: 'پرفروش‌ترین' },
  { id: 'newest', label: 'جدیدترین' },
  { id: 'price-asc', label: 'ارزان‌ترین' },
  { id: 'price-desc', label: 'گران‌ترین' },
  { id: 'weight-asc', label: 'سبک‌ترین' },
  { id: 'weight-desc', label: 'سنگین‌ترین' },
];

/** One removable chip: what it says, and which field it clears. */
export interface ActiveFilter {
  readonly field: keyof ListingQuery;
  readonly label: string;
}

const COLOUR_LABEL: Readonly<Record<string, string>> = {
  yellow: 'طلای زرد',
  rose: 'رزگلد',
  white: 'طلای سفید',
};

const COLLECTION_LABEL: Readonly<Record<string, string>> = {
  'weekly-sale': 'حراج هفته',
  bridal: 'مجموعه عروس',
};

/** One toman is ten rials, and budgets are spoken in millions of toman. */
function tomanMillions(rialsText: string): string {
  const millions = BigInt(rialsText) / 10_000_000n;
  return `${toPersianDigits(millions.toString())} میلیون تومان`;
}

function gramsLabel(milligramsText: string): string {
  const grams = Number(milligramsText) / 1000;
  return `${toPersianDigits(String(grams))} گرم`;
}

/**
 * The chips above the grid: one per filter that is actually narrowing it.
 *
 * Sort and page are absent on purpose. Neither hides a product, so offering to
 * clear them would be offering to reorder a list nobody asked to reorder.
 */
export function activeFilters(query: ListingQuery): readonly ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (query.q !== undefined) chips.push({ field: 'q', label: `«${query.q}»` });
  if (query.minPriceRials !== undefined) {
    chips.push({ field: 'minPriceRials', label: `از ${tomanMillions(query.minPriceRials)}` });
  }
  if (query.maxPriceRials !== undefined) {
    chips.push({ field: 'maxPriceRials', label: `تا ${tomanMillions(query.maxPriceRials)}` });
  }
  if (query.minWeightMg !== undefined) {
    chips.push({ field: 'minWeightMg', label: `از ${gramsLabel(query.minWeightMg)}` });
  }
  if (query.maxWeightMg !== undefined) {
    chips.push({ field: 'maxWeightMg', label: `تا ${gramsLabel(query.maxWeightMg)}` });
  }
  if (query.karat !== undefined) {
    chips.push({ field: 'karat', label: `${toPersianDigits(String(query.karat))} عیار` });
  }
  if (query.colour !== undefined) {
    chips.push({ field: 'colour', label: COLOUR_LABEL[query.colour] ?? query.colour });
  }
  if (query.collection !== undefined) {
    chips.push({
      field: 'collection',
      label: COLLECTION_LABEL[query.collection] ?? query.collection,
    });
  }
  if (query.discounted) chips.push({ field: 'discounted', label: 'تخفیف اجرت' });
  if (query.installment) chips.push({ field: 'installment', label: 'قابل خرید اقساطی' });
  if (query.inStock) chips.push({ field: 'inStock', label: 'فقط موجود' });

  return chips;
}

/** What clearing one chip means: an absent value, or a false flag. */
export function clearPatch(field: keyof ListingQuery): ListingPatch {
  const flags = new Set(['discounted', 'installment', 'inStock']);
  return { [field]: flags.has(field) ? false : null, page: 1 } as ListingPatch;
}

/* -------------------------------------------------------------------------- */
/* Counts                                                                     */
/* -------------------------------------------------------------------------- */

export function resultCount(total: number): string {
  return total === 0 ? 'نتیجه‌ای پیدا نشد' : `${toPersianDigits(String(total))} محصول`;
}

export function pageLabel(page: number, pageCount: number): string {
  return `صفحه ${toPersianDigits(String(page))} از ${toPersianDigits(String(pageCount))}`;
}

/**
 * The sentence an empty listing shows.
 *
 * Different when a filter is on, because the two situations have different
 * answers: «there is nothing here» is a dead end, and «your filters found
 * nothing» has a button.
 */
export function emptyMessage(query: ListingQuery, activeFilterCount: number): string {
  if (query.q !== undefined) {
    return `برای «${query.q}» نتیجه‌ای پیدا نشد. املای عبارت را بررسی کنید یا دسته‌بندی‌ها را مرور کنید.`;
  }
  if (activeFilterCount > 0) {
    return 'با این فیلترها محصولی پیدا نشد. یکی از فیلترها را بردارید تا نتایج بیشتری ببینید.';
  }
  return 'در این دسته هنوز محصولی ثبت نشده است.';
}
