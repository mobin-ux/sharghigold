import type { FacetTile } from '@sharghigold/contracts';

/**
 * The listing URL a facet tile points at.
 *
 * Filters travel as query parameters rather than as extra path segments so
 * that a listing can carry several at once, and so the listing page re-parses
 * every one of them server-side. Nothing here validates the values — that is
 * the listing's job, and doing it in two places is how the two get to
 * disagree.
 *
 * `URLSearchParams` does the encoding, which is what keeps a label like
 * «شمش ۱ گرمی» or a stray `&` from turning into a second parameter.
 */
export function tileHref(tile: FacetTile): string {
  const query = new URLSearchParams(tile.query).toString();
  const path = `/categories/${encodeURIComponent(tile.slug)}`;

  return query === '' ? path : `${path}?${query}`;
}
