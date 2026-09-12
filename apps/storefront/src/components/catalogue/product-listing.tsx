import Link from 'next/link';
import type { ListingQuery, ProductListing } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/ui';

import { ProductTile } from '@/components/home/product-tile';
import {
  activeFilters,
  clearedHref,
  clearPatch,
  emptyMessage,
  listingHref,
  pageLabel,
  resultCount,
  SORT_OPTIONS,
} from '@/lib/listing-view';

/**
 * The product grid, and the controls above and below it.
 *
 * One component behind three routes — `/products`, `/categories/:slug` and
 * `/search` — because they are one screen with different starting filters. A
 * search that laid out differently from a category listing would be two
 * implementations of the same thing, and the second one is where the
 * out-of-stock badge goes missing.
 *
 * Nothing here hydrates. Every control is a link to the same page with one
 * parameter changed, so the whole surface works before JavaScript, is
 * bookmarkable and is crawlable. `next/link` prefetches each destination, so
 * the links are also the fastest way to move between these views.
 */
export function ProductListingView({
  basePath,
  query,
  listing,
}: {
  /** The path this listing lives at, without the query. */
  readonly basePath: string;
  readonly query: ListingQuery;
  readonly listing: ProductListing;
}) {
  const chips = activeFilters(query);

  return (
    <div className="zn-listing">
      <div className="zn-listbar">
        {/* role="status" so a filtered grid announces how much it found,
            which a sighted customer reads off the same line. */}
        <p className="zn-listbar__count" role="status">
          {resultCount(listing.total)}
        </p>

        <nav className="zn-listbar__sorts" aria-label="ترتیب نمایش">
          {SORT_OPTIONS.map((option) => (
            <Link
              className={`zn-listsort${option.id === query.sort ? ' zn-listsort--on' : ''}`}
              key={option.id}
              href={listingHref(basePath, query, { sort: option.id, page: 1 })}
              aria-current={option.id === query.sort ? 'true' : undefined}
              scroll={false}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>

      {chips.length === 0 ? null : (
        <nav className="zn-listchips" aria-label="فیلترهای فعال">
          {chips.map((chip) => (
            <Link
              className="zn-listchip"
              key={`${chip.field}-${chip.label}`}
              href={listingHref(basePath, query, clearPatch(chip.field))}
              scroll={false}
            >
              <span>{chip.label}</span>
              {/* The label already says what the filter is; this says what the
                  link does, which is not the same sentence. */}
              <span className="sr-only">— حذف این فیلتر</span>
              <span className="zn-listchip__x" aria-hidden="true">
                ✕
              </span>
            </Link>
          ))}

          {chips.length > 1 ? (
            <Link className="zn-listchip zn-listchip--clear" href={clearedHref(basePath, query)}>
              حذف همه فیلترها
            </Link>
          ) : null}
        </nav>
      )}

      {listing.items.length === 0 ? (
        <div className="zn-listempty">
          <p className="zn-listempty__text">{emptyMessage(query, listing.activeFilterCount)}</p>
          {listing.activeFilterCount > 0 ? (
            <Link className="zn-listempty__action" href={clearedHref(basePath, query)}>
              حذف فیلترها
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="zn-grid zn-listing__grid">
          {listing.items.map((product) => (
            <li key={product.slug}>
              <ProductTile product={product} />
            </li>
          ))}
        </ul>
      )}

      <ListingPager basePath={basePath} query={query} listing={listing} />
    </div>
  );
}

/**
 * Previous, next, and where you are.
 *
 * Numbered links rather than an infinite scroll: this grid has to be
 * crawlable, and page two of an infinite scroll has no address. The window is
 * five pages wide so the control stays one row at 320px.
 */
function ListingPager({
  basePath,
  query,
  listing,
}: {
  readonly basePath: string;
  readonly query: ListingQuery;
  readonly listing: ProductListing;
}) {
  if (listing.pageCount <= 1) return null;

  const window = 2;
  const from = Math.max(1, Math.min(query.page - window, listing.pageCount - window * 2));
  const to = Math.min(listing.pageCount, Math.max(query.page + window, window * 2 + 1));
  const pages = Array.from({ length: to - from + 1 }, (_, index) => from + index);

  return (
    <nav className="zn-pager" aria-label="صفحه‌بندی نتایج">
      {query.page > 1 ? (
        <Link
          className="zn-pager__step"
          href={listingHref(basePath, query, { page: query.page - 1 })}
          rel="prev"
        >
          قبلی
        </Link>
      ) : (
        <span className="zn-pager__step zn-pager__step--off">قبلی</span>
      )}

      <ol className="zn-pager__pages">
        {pages.map((page) => (
          <li key={page}>
            <Link
              className={`zn-pager__page${page === query.page ? ' zn-pager__page--on' : ''}`}
              href={listingHref(basePath, query, { page })}
              aria-current={page === query.page ? 'page' : undefined}
              aria-label={`صفحه ${toPersianDigits(page)}`}
            >
              {toPersianDigits(page)}
            </Link>
          </li>
        ))}
      </ol>

      {query.page < listing.pageCount ? (
        <Link
          className="zn-pager__step"
          href={listingHref(basePath, query, { page: query.page + 1 })}
          rel="next"
        >
          بعدی
        </Link>
      ) : (
        <span className="zn-pager__step zn-pager__step--off">بعدی</span>
      )}

      <p className="sr-only" role="status">
        {pageLabel(query.page, listing.pageCount)}
      </p>
    </nav>
  );
}
