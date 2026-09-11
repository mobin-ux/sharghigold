import Link from 'next/link';
import type { ReactElement } from 'react';

import { CardIcon, HeartIcon, InvoiceIcon, PinIcon } from '@/components/icons';
import { persianCount } from '@/lib/account-view';

interface Tile {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactElement;
  readonly count: number;
}

interface QuickTilesProps {
  readonly orderCount: number;
  readonly addressCount: number;
  readonly favouriteCount: number;
  readonly installmentCount: number;
}

/**
 * The four shortcuts under the verification row.
 *
 * Each badge is a count the server actually holds. A zero draws no badge
 * rather than a «۰»: a bubble is for something waiting, and nothing waiting is
 * not news.
 */
export function QuickTiles({
  orderCount,
  addressCount,
  favouriteCount,
  installmentCount,
}: QuickTilesProps) {
  const tiles: readonly Tile[] = [
    {
      href: '/account/orders',
      label: 'سفارش‌ها',
      icon: <InvoiceIcon size={22} />,
      count: orderCount,
    },
    {
      href: '/account/installments',
      label: 'اقساط من',
      icon: <CardIcon size={22} />,
      count: installmentCount,
    },
    {
      href: '/account/favourites',
      label: 'علاقه‌مندی',
      icon: <HeartIcon size={22} />,
      count: favouriteCount,
    },
    {
      href: '/account/addresses',
      label: 'آدرس‌ها',
      icon: <PinIcon size={22} />,
      count: addressCount,
    },
  ];

  return (
    <nav className="zn-tiles" aria-label="میان‌برهای حساب">
      <ul className="zn-tiles__list">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link className="zn-tile" href={tile.href}>
              <span className="zn-tile__icon" aria-hidden="true">
                {tile.icon}
              </span>
              <span className="zn-tile__label">{tile.label}</span>
              {tile.count > 0 ? (
                <span className="zn-tile__badge">{persianCount(tile.count)}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
