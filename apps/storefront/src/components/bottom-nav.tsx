'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';

import { CartBadge } from '@/components/cart-badge';
import { CardIcon, CartIcon, GridIcon, HomeIcon, UserIcon } from '@/components/icons';

interface Tab {
  readonly href: string;
  readonly label: string;
  readonly icon: ReactElement;
  /** Whether this tab carries the basket count bubble. */
  readonly badge?: boolean;
}

const TABS: readonly Tab[] = [
  { href: '/', label: 'خانه', icon: <HomeIcon /> },
  { href: '/categories', label: 'دسته‌بندی', icon: <GridIcon /> },
  { href: '/installment', label: 'خرید اقساطی', icon: <CardIcon /> },
  { href: '/cart', label: 'سبد خرید', icon: <CartIcon />, badge: true },
  { href: '/account', label: 'حساب من', icon: <UserIcon /> },
];

/**
 * The fixed bottom tab bar.
 *
 * A client component only because the current tab depends on the URL. The
 * design tracks it in component state, which is wrong in two ways: it survives
 * a real navigation (so the highlight and the page disagree) and it is lost on
 * reload. `usePathname` is the actual answer to «which page am I on».
 *
 * The active tab carries `aria-current="page"`, so the current location is
 * announced rather than only coloured.
 *
 * `docked` drops the fixed positioning for pages built as an app shell, where
 * the bar is the last row of a column that already fills the viewport and
 * fixing it would take it out of that layout.
 */
export function BottomNav({ docked = false }: { readonly docked?: boolean } = {}) {
  const pathname = usePathname();

  return (
    <nav className={`zn-tabbar${docked ? ' zn-tabbar--docked' : ''}`} aria-label="پیمایش اصلی">
      <ul className="zn-tabbar__list">
        {TABS.map((tab) => {
          const current = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                className={`zn-tabbar__item${current ? ' zn-tabbar__item--on' : ''}`}
                href={tab.href}
                aria-current={current ? 'page' : undefined}
              >
                <span className="zn-tabbar__icon">
                  {tab.icon}
                  {tab.badge === true ? <CartBadge variant="tab" /> : null}
                </span>
                <span className="zn-tabbar__label">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
