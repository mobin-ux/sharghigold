import type { ListingQuery, ProductListing } from '@sharghigold/contracts';

import { clearedHref, NO_FACETS } from '@/lib/listing-view';

import { ListingResults } from './listing-results';
import { ListingToolbar } from './listing-toolbar';

/**
 * The toolbar and the grid, for a listing that is not a category.
 *
 * `/products` and `/search` are the category screen with no category: the same
 * filter and sort sheets, the same chips, the same grid and «load more». They
 * keep the site header rather than the category header, so the toolbar does
 * not stick — the site header already does.
 *
 * The sheet offers purity and price here but no models or weight bands, which
 * belong to a category's taxonomy and mean nothing across the whole shop.
 */
export function ProductListingView({
  basePath,
  query,
  listing,
}: {
  /** The path this listing lives at, without the query. */
  readonly basePath: string;
  readonly query: ListingQuery;
  /** A cumulative listing: every item from page one to `query.page`. */
  readonly listing: ProductListing;
}) {
  return (
    <>
      <ListingToolbar
        basePath={basePath}
        query={query}
        total={listing.total}
        filterCount={listing.activeFilterCount}
        facets={NO_FACETS}
      />
      <ListingResults
        basePath={basePath}
        query={query}
        listing={listing}
        filterCount={listing.activeFilterCount}
        clearHref={clearedHref(basePath, query)}
      />
    </>
  );
}
