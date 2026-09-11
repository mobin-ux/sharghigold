import type { AccountOrder } from '@sharghigold/contracts';
import Link from 'next/link';

import {
  jalaliDate,
  ORDER_STATE_LABEL,
  ORDER_STATE_TONE,
  orderActionLabel,
  toman,
} from '@/lib/account-view';

/**
 * Where the card's second button goes, or nowhere.
 *
 * A cancelled order can be bought again when it names a product still in the
 * catalogue, and a delivered one can be reviewed. Where the destination does
 * not exist the button is not drawn: a control that goes nowhere is worse than
 * an absent one, because it is discovered by being pressed.
 */
function actionHref(order: AccountOrder): string | undefined {
  if (order.productSlug === null) return undefined;
  if (order.state === 'cancelled') return `/products/${order.productSlug}`;
  if (order.state === 'delivered') return `/products/${order.productSlug}/reviews/new`;

  return undefined;
}

export function OrderCard({ order }: { readonly order: AccountOrder }) {
  const href = actionHref(order);
  const tone = ORDER_STATE_TONE[order.state];

  return (
    <article className="zn-order">
      <header className="zn-order__head">
        <span className={`zn-order__state zn-order__state--${tone}`}>
          {ORDER_STATE_LABEL[order.state]}
        </span>
        <span className="zn-order__code">{order.code}</span>
        <time className="zn-order__date" dateTime={order.placedAt}>
          {jalaliDate(order.placedAt)}
        </time>
      </header>

      <div className="zn-order__body">
        <span className="zn-order__thumb" aria-hidden="true" />
        <span className="zn-order__text">
          <span className="zn-order__title">{order.title}</span>
          <span className="zn-order__price">
            <span className="zn-order__figure">{toman(order.totalRials)}</span>
            <span className="zn-order__unit">تومان</span>
          </span>
        </span>
      </div>

      <footer className="zn-order__foot">
        <Link className="zn-order__ghost" href={`/account/orders/${order.code}`}>
          جزئیات سفارش
        </Link>
        {href === undefined ? null : (
          <Link className={`zn-order__cta zn-order__cta--${tone}`} href={href}>
            {orderActionLabel(order.state)}
          </Link>
        )}
      </footer>
    </article>
  );
}
