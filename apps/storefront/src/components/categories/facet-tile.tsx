import Link from 'next/link';
import type { FacetTile as FacetTileData } from '@sharghigold/contracts';

import { AllProductsMark, Mark } from '@/components/marks/mark';
import { tileHref } from '@/lib/catalogue-href';

/**
 * One tile in a facet group: a mark, and the label underneath it.
 *
 * An ordinary link. The whole browser is navigation, and navigation that needs
 * JavaScript to work is navigation that a crawler cannot follow and a customer
 * on a slow connection cannot use before hydration.
 *
 * A tile with no icon is the «همه کالاها» entry, which clears the group's
 * filter rather than applying one, and is drawn as chrome rather than as
 * another product illustration.
 */
export function FacetTile({ tile }: { readonly tile: FacetTileData }) {
  const { icon } = tile;

  return (
    // Prefetch is off deliberately. A category shows up to twenty-eight tiles
    // and a customer follows one of them; prefetching every tile that scrolls
    // into view would fetch two dozen listings to throw away, which on a phone
    // on mobile data is somebody's money.
    <Link className="zn-tile" href={tileHref(tile)} prefetch={false}>
      <span className={`zn-tile__mark${icon === null ? ' zn-tile__mark--all' : ''}`}>
        {icon === null ? <AllProductsMark /> : <Mark icon={icon} />}
      </span>
      <span className="zn-tile__label">{tile.label}</span>
    </Link>
  );
}
