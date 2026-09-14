import Link from 'next/link';
import type { ListingQuery, ProductListing } from '@sharghigold/contracts';

import { ProductTile } from '@/components/home/product-tile';
import { SearchIcon } from '@/components/icons';
import { countLabel, emptyCopy, listingHref } from '@/lib/listing-view';

/**
 * The count, the grid, and «نمایش کالاهای بیشتر».
 *
 * Rendered on the server with no client code. «Load more» is a link to the
 * next page of a cumulative listing — `?page=2` shows pages one and two — so it
 * works before hydration, the URL restores exactly what was on screen, and
 * `scroll={false}` keeps the customer where they were while the rest arrives.
 */
export function ListingResults({
  basePath,
  query,
  listing,
  filterCount,
  clearHref,
}: {
  readonly basePath: string;
  readonly query: ListingQuery;
  /** A cumulative listing: every item from page one to `query.page`. */
  readonly listing: ProductListing;
  readonly filterCount: number;
  /** Where «حذف فیلترها» goes; on a sub-type page, that is the whole category. */
  readonly clearHref: string;
}) {
  const hasMore = listing.page < listing.pageCount;

  return (
    <>
      <div className="zn-listcount">
        {/* role="status" so a filtered grid announces how much it found, which a
            sighted customer reads off the same line. */}
        <p className="zn-listcount__total" role="status">
          {countLabel(listing.total)}
        </p>
        {filterCount === 0 ? null : (
          <Link className="zn-listcount__clear" href={clearHref} scroll={false}>
            حذف فیلترها
          </Link>
        )}
      </div>

      {listing.items.length === 0 ? (
        <ListingEmpty query={query} filterCount={filterCount} clearHref={clearHref} />
      ) : (
        <ul className="zn-grid zn-listgrid">
          {listing.items.map((product) => (
            <li className="zn-listgrid__item" key={product.slug}>
              <ProductTile product={product} />
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className="zn-loadmore">
          <Link
            className="zn-loadmore__btn"
            href={listingHref(basePath, query, { page: listing.page + 1 })}
            scroll={false}
          >
            نمایش کالاهای بیشتر
          </Link>
        </div>
      ) : null}
    </>
  );
}

function ListingEmpty({
  query,
  filterCount,
  clearHref,
}: {
  readonly query: ListingQuery;
  readonly filterCount: number;
  readonly clearHref: string;
}) {
  const copy = emptyCopy(query, filterCount);

  return (
    <div className="zn-listempty">
      <span className="zn-listempty__icon">
        <SearchIcon size={26} />
      </span>
      <p className="zn-listempty__title">{copy.title}</p>
      <p className="zn-listempty__text">{copy.text}</p>
      {copy.canClear ? (
        <Link className="zn-listempty__action" href={clearHref} scroll={false}>
          حذف همه فیلترها
        </Link>
      ) : null}
    </div>
  );
}
