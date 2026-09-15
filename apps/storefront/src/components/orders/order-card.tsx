import type { OrderFile } from '@sharghigold/contracts';
import Link from 'next/link';

import { toman } from '@/lib/account-view';
import {
  dayMonthYear,
  lineSpec,
  liveReturn,
  orderCodeLabel,
  orderStatus,
  progressNote,
  progressStep,
} from '@/lib/order-file-view';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';

import { OrderPill } from './order-chrome';
import { ReorderButton } from './order-forms';
import { PieceIcon } from './order-icons';

/**
 * The gold button on a card: the one thing this order most needs next.
 *
 * Read from the server's allowances, so a card never offers a cancellation the
 * order no longer permits. Where nothing fits, it offers the parcel's story.
 */
function link(href: string, label: string) {
  return (
    <Link className="zn-ordbtn zn-ordbtn--gold" href={href}>
      {label}
    </Link>
  );
}

function PrimaryAction({ order }: { readonly order: OrderFile }) {
  if (liveReturn(order) !== null)
    return link(routes.accountOrderReturn(order.code), 'وضعیت مرجوعی');
  if (order.state === 'shipped')
    return link(routes.accountOrderTracking(order.code), 'پیگیری مرسوله');
  if (order.allowed.review) return link(routes.accountOrderReview(order.code), 'ثبت نظر');
  if (order.allowed.reorder) {
    return (
      <ReorderButton code={order.code} variant="card">
        خرید دوباره
      </ReorderButton>
    );
  }
  if (order.allowed.cancel) return link(routes.accountOrderCancel(order.code), 'لغو سفارش');
  return link(routes.accountOrderTracking(order.code), 'پیگیری مرسوله');
}

export function OrderCard({ order }: { readonly order: OrderFile }) {
  const status = orderStatus(order);
  const [first] = order.lines;
  const more = order.lines.length - 1;
  const step = progressStep(order);
  const href = routes.accountOrder(order.code);

  return (
    <article className="zn-ordcard" aria-labelledby={`order-${order.code}`}>
      <div className="zn-ordcard__head">
        <OrderPill tone={status.tone}>{status.label}</OrderPill>
        <span className="zn-ordcard__code" id={`order-${order.code}`}>
          {orderCodeLabel(order.code)}
        </span>
        <time className="zn-ordcard__date" dateTime={order.placedAt}>
          {dayMonthYear(order.placedAt)}
        </time>
      </div>

      <Link className="zn-ordcard__main" href={href}>
        <span className="zn-ordthumb" aria-hidden="true">
          <PieceIcon />
          {more > 0 ? <span className="zn-ordthumb__more">{`+${persianCount(more)}`}</span> : null}
        </span>
        <span className="zn-ordcard__text">
          <span className="zn-ordcard__title">{first?.title}</span>
          <span className="zn-ordcard__sub">
            {more > 0
              ? `و ${persianCount(more)} کالای دیگر`
              : first === undefined
                ? ''
                : lineSpec(first)}
          </span>
        </span>
        <span className="zn-ordcard__price">
          <span className="zn-ordcard__figure">{toman(order.bill.totalRials)}</span>
          <span className="zn-ordcard__unit">تومان</span>
        </span>
      </Link>

      {order.state === 'cancelled' ? null : (
        <div className="zn-ordcard__progress">
          <ol className="zn-ordbars" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <li
                key={index}
                className={`zn-ordbars__bar${index <= step ? ' zn-ordbars__bar--on' : ''}`}
              />
            ))}
          </ol>
          <span className="zn-ordcard__note">{progressNote(order)}</span>
        </div>
      )}

      <div className="zn-ordcard__foot">
        <div>
          <Link className="zn-ordbtn" href={href}>
            جزئیات سفارش
          </Link>
        </div>
        <div>
          <PrimaryAction order={order} />
        </div>
      </div>
    </article>
  );
}
