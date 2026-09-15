import Link from 'next/link';
import type { ReactNode } from 'react';

import type { OrderTone } from '@/lib/order-file-view';

import { BackIcon } from './order-icons';

/**
 * The sticky bar every order screen opens with.
 *
 * The back control is a link to the parent screen, not `history.back()`: the
 * canvas's views become addresses, and somebody who opened a tracking link
 * from an SMS has no history to go back through.
 */
export function OrderHeader({
  back,
  title,
  sub,
  end,
  children,
}: {
  readonly back: string;
  readonly title: string;
  /** A second line under the title, as the support screen sets the order code. */
  readonly sub?: string;
  /** What sits at the far end of the row. */
  readonly end?: ReactNode;
  /** Extra rows under the title row, such as the list's search field. */
  readonly children?: ReactNode;
}) {
  return (
    <header className={`zn-ordhead${children === undefined ? '' : ' zn-ordhead--search'}`}>
      <div className="zn-ordhead__row">
        <Link className="zn-ordhead__back" href={back} aria-label="بازگشت">
          <BackIcon />
        </Link>
        {sub === undefined ? (
          <h1 className="zn-ordhead__title">{title}</h1>
        ) : (
          <span className="zn-ordhead__stack">
            <h1 className="zn-ordhead__title">{title}</h1>
            <span className="zn-ordhead__sub">{sub}</span>
          </span>
        )}
        {end}
      </div>
      {children}
    </header>
  );
}

export function OrderPill({
  tone,
  children,
}: {
  readonly tone: OrderTone | 'idle';
  readonly children: ReactNode;
}) {
  return <span className={`zn-ordpill zn-ordpill--${tone}`}>{children}</span>;
}
