import Link from 'next/link';
import type { ReactElement } from 'react';

import { ChevronIcon } from '@/components/icons';

export interface MenuEntry {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactElement;
  /** The figure on the right: a count, a weight. Already formatted. */
  readonly meta?: string;
}

interface MenuListProps {
  readonly id: string;
  readonly title: string;
  readonly items: readonly MenuEntry[];
}

/**
 * One titled group of account links.
 *
 * A `<ul>` inside a `<nav>`, so a screen reader announces how many entries the
 * group holds before reading them. The design's row of bare anchors announces
 * nothing at all, and the heading it draws above them is a `<span>`.
 */
export function MenuList({ id, title, items }: MenuListProps) {
  return (
    <nav className="zn-menu" aria-labelledby={id}>
      <h2 className="zn-menu__title" id={id}>
        {title}
      </h2>
      <ul className="zn-menu__list">
        {items.map((item) => (
          <li className="zn-menu__row" key={item.href}>
            <Link className="zn-menu__link" href={item.href}>
              <span className="zn-menu__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="zn-menu__label">{item.label}</span>
              <span className="zn-menu__end">
                {item.meta === undefined ? null : (
                  <span className="zn-menu__meta">{item.meta}</span>
                )}
                <span className="zn-menu__go" aria-hidden="true">
                  <ChevronIcon size={15} strokeWidth={2} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
