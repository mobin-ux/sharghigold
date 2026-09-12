import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CheckIcon, InfoIcon, WarningIcon } from '@/components/icons';
import { ORDER_RESULT, resultRows } from '@/lib/cart-view';
import { requireViewer } from '@/server/account/session';
import { getPlacedOrder } from '@/server/checkout/orders';

import '../../checkout.css';
import '../../../cart/cart.css';
import '../../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'نتیجه پرداخت',
  robots: { index: false, follow: false },
};

const GLYPH = { good: CheckIcon, bad: WarningIcon, idle: InfoIcon } as const;

/**
 * How it ended.
 *
 * Reads the order's own snapshot and nothing else. Every figure on this page
 * was written when the order was placed — the amount charged, the bank's
 * reference, where it is going — so refreshing it, bookmarking it or opening
 * it a week later shows the same thing. Nothing here settles a payment or
 * moves money: a page that charges on render is a page a refresh charges
 * twice.
 *
 * An order belonging to another customer is a 404, not a 403, because a 403
 * confirms the code exists.
 */
export default async function OrderResultPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const viewer = await requireViewer();
  const { code } = await params;

  const order = getPlacedOrder(viewer, code);
  if (order === undefined) notFound();

  const copy = ORDER_RESULT[order.paymentState];
  const Glyph = GLYPH[copy.tone];

  return (
    <div className="zn-shell zn-shell--plain zn-result">
      <header className="zn-result__head">
        <h1 className="zn-result__headtitle">{copy.head}</h1>
      </header>

      <div className="zn-result__hero">
        <span className={`zn-result__glyph zn-result__glyph--${copy.tone}`} aria-hidden="true">
          <Glyph size={34} strokeWidth={2.1} />
        </span>
        <h2 className="zn-result__title">{copy.title}</h2>
        <p className="zn-result__note">{copy.note}</p>
      </div>

      <dl className="zn-result__rows">
        {resultRows(order).map(([label, value]) => (
          <div className="zn-result__row" key={label}>
            <dt className="zn-result__label">{label}</dt>
            <dd className="zn-result__value">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="zn-result__actions">
        {order.paymentState === 'paid' ? (
          <Link className="zn-result__primary" href="/account/orders">
            پیگیری سفارش
          </Link>
        ) : copy.retry ? (
          <Link className="zn-result__primary" href="/checkout/review">
            تلاش دوباره برای پرداخت
          </Link>
        ) : null}

        <Link className="zn-result__ghost" href="/">
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
