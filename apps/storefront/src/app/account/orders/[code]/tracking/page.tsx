import { toPersianDigits } from '@sharghigold/money';
import type { Metadata } from 'next';
import Link from 'next/link';

import { CopyCode } from '@/components/orders/copy-code';
import { OrderHeader } from '@/components/orders/order-chrome';
import { TruckIcon } from '@/components/orders/order-icons';
import { OrderEvents } from '@/components/orders/order-sections';
import { dayMonthYear } from '@/lib/order-file-view';
import { routes } from '@/lib/routes';

import '../../../account.css';
import '../../orders.css';
import { loadOrder } from '../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'پیگیری مرسوله',
  robots: { index: false, follow: false },
};

export default async function OrderTrackingPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { order } = await loadOrder(params);
  const { delivery, shipment } = order;
  const delivered = shipment.deliveredAt !== null;

  const meta = delivered
    ? 'تحویل‌شده به گیرنده'
    : delivery.mode === 'pickup'
      ? 'تحویل حضوری در شعبه'
      : 'تحویل درب منزل · بیمه‌شده';

  return (
    <div className="zn-shell">
      <OrderHeader back={routes.accountOrder(order.code)} title="پیگیری مرسوله" />

      <main>
        <section className="zn-ordsec" aria-label="مرسوله">
          <div className="zn-ordcourier">
            <span className="zn-ordcourier__glyph" aria-hidden="true">
              <TruckIcon size={22} weight={1.8} />
            </span>
            <span className="zn-ordcourier__text">
              <span className="zn-ordcourier__name">
                {shipment.carrier ?? delivery.methodLabel}
              </span>
              <span className="zn-ordcourier__meta">{meta}</span>
            </span>
          </div>

          <div className="zn-ordcode">
            <span className="zn-ordcode__label">کد رهگیری پستی</span>
            {shipment.trackingCode === null ? (
              <span className="zn-ordcode__value zn-ordcode__value--pending">
                پس از ارسال پیامک می‌شود
              </span>
            ) : (
              <>
                <span className="zn-ordcode__value">{toPersianDigits(shipment.trackingCode)}</span>
                <CopyCode value={shipment.trackingCode} label="کپی کد رهگیری" />
              </>
            )}
          </div>

          {delivered || shipment.estimatedAt !== null ? (
            <div className="zn-ordeta">
              <span className="zn-ordeta__label">{delivered ? 'تحویل شد' : 'تحویل تخمینی'}</span>
              <span className="zn-ordeta__value">
                {dayMonthYear(shipment.deliveredAt ?? shipment.estimatedAt ?? order.placedAt)}
              </span>
            </div>
          ) : null}
        </section>

        <OrderEvents order={order} />

        {order.state === 'cancelled' ? null : (
          <div className="zn-ordpad">
            <Link
              className="zn-ordbtn zn-ordbtn--surface"
              href={routes.accountOrderSupport(order.code)}
            >
              {delivered ? 'مشکلی در تحویل بود' : 'مرسوله را دریافت نکرده‌ام'}
            </Link>
          </div>
        )}
        <div className="zn-ordtail" />
      </main>
    </div>
  );
}
