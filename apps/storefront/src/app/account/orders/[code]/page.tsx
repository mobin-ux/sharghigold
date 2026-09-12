import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { orderCodeSchema } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/ui';

import { PageHead } from '@/components/account/page-head';
import {
  jalaliDate,
  ORDER_STATE_LABEL,
  ORDER_STATE_TONE,
  ORDER_STEPS,
  toman,
} from '@/lib/account-view';
import { PAYMENT_STATE_LABEL, PAYMENT_STATE_TONE } from '@/lib/order-view';
import { routes } from '@/lib/routes';
import { findOrder } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import '../../account.css';
import './order.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
  // Never indexed: the page only exists for its owner, and its address
  // contains an order code.
  robots: { index: false, follow: false },
};

/** Which of the four stages the parcel has reached. */
const STEP_OF: Readonly<Record<string, number>> = {
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: 0,
};

/**
 * One order, as the customer's own record of it.
 *
 * Every order card in the account has linked here since the account was built,
 * and the route did not exist — so «جزئیات سفارش» was a 404 on every order a
 * customer has ever placed.
 *
 * An order belonging to somebody else is a 404, not a 403. The two answers
 * differ in exactly one way that matters: a 403 confirms the order code is
 * real. `findOrder` reads only rows belonging to this viewer, so the page
 * cannot answer anything else even by accident.
 */
export default async function OrderDetailPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const viewer = await requireViewer();
  const { code } = await params;

  // The code is arbitrary text from the URL. Shape-checking it first means a
  // value that could not be an order code never reaches the lookup at all.
  const parsed = orderCodeSchema.safeParse(code);
  const order = parsed.success ? findOrder(viewer, parsed.data) : undefined;

  if (order === undefined) notFound();

  const tone = ORDER_STATE_TONE[order.state];
  const step = STEP_OF[order.state] ?? 0;

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="جزئیات سفارش" back={routes.accountOrders()} />

      <main className="zn-orderdetail">
        <header className="zn-odhead">
          <span className={`zn-order__state zn-order__state--${tone}`}>
            {ORDER_STATE_LABEL[order.state]}
          </span>
          <h1 className="zn-odhead__code">{toPersianDigits(order.code)}</h1>
          <time className="zn-odhead__date" dateTime={order.placedAt}>
            {`ثبت شده در ${jalaliDate(order.placedAt)}`}
          </time>
        </header>

        {order.state === 'cancelled' ? null : (
          <section className="zn-odsteps" aria-label="وضعیت ارسال">
            <ol className="zn-odsteps__list">
              {ORDER_STEPS.map((label, index) => (
                <li
                  className={`zn-odstep${index <= step ? ' zn-odstep--done' : ''}`}
                  key={label}
                  aria-current={index === step ? 'step' : undefined}
                >
                  <span className="zn-odstep__dot" aria-hidden="true" />
                  <span className="zn-odstep__label">{label}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="zn-odcard" aria-labelledby="od-items">
          <h2 className="zn-odcard__title" id="od-items">
            کالاهای سفارش
          </h2>
          <div className="zn-oditem">
            <span className="zn-oditem__thumb" aria-hidden="true" />
            <span className="zn-oditem__text">
              <span className="zn-oditem__title">{order.title}</span>
              <span className="zn-oditem__count">{`${toPersianDigits(order.itemCount)} قلم`}</span>
            </span>
          </div>

          {order.productSlug === null ? null : (
            <Link className="zn-odcard__link" href={routes.product(order.productSlug)}>
              مشاهده کالا
            </Link>
          )}
        </section>

        <section className="zn-odcard" aria-labelledby="od-payment">
          <h2 className="zn-odcard__title" id="od-payment">
            پرداخت
          </h2>

          <dl className="zn-odrows">
            <div className="zn-odrow">
              <dt>مبلغ سفارش</dt>
              <dd>{`${toman(order.totalRials)} تومان`}</dd>
            </div>

            {order.paymentState === null ? (
              <div className="zn-odrow zn-odrow--muted">
                <dt>وضعیت پرداخت</dt>
                {/* Older orders predate the payment record. Saying so is
                    honest; inventing «پرداخت شده» would not be. */}
                <dd>در سوابق این سفارش ثبت نشده است</dd>
              </div>
            ) : (
              <>
                <div className="zn-odrow">
                  <dt>وضعیت پرداخت</dt>
                  <dd
                    className={`zn-odstate zn-odstate--${PAYMENT_STATE_TONE[order.paymentState]}`}
                  >
                    {PAYMENT_STATE_LABEL[order.paymentState]}
                  </dd>
                </div>
                {order.paymentLabel === null ? null : (
                  <div className="zn-odrow">
                    <dt>روش پرداخت</dt>
                    <dd>{order.paymentLabel}</dd>
                  </div>
                )}
                {order.paidRials === null || order.paymentState !== 'paid' ? null : (
                  <div className="zn-odrow">
                    <dt>مبلغ پرداختی</dt>
                    <dd>{`${toman(order.paidRials)} تومان`}</dd>
                  </div>
                )}
                {order.reference === null ? null : (
                  <div className="zn-odrow">
                    <dt>کد پیگیری بانک</dt>
                    <dd dir="ltr">{toPersianDigits(order.reference)}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </section>

        {order.deliveryLabel === null ? null : (
          <section className="zn-odcard" aria-labelledby="od-delivery">
            <h2 className="zn-odcard__title" id="od-delivery">
              تحویل
            </h2>
            <p className="zn-odcard__body">{order.deliveryLabel}</p>
          </section>
        )}

        <section className="zn-odcard zn-odcard--help">
          <h2 className="zn-odcard__title">کمک لازم دارید؟</h2>
          <p className="zn-odcard__body">
            برای پیگیری مرسوله، مرجوعی یا فاکتور رسمی این سفارش با پشتیبانی تماس بگیرید و شماره
            سفارش را اعلام کنید.
          </p>
          <div className="zn-odcard__actions">
            <Link className="zn-odcard__primary" href={routes.contact()}>
              تماس با پشتیبانی
            </Link>
            <Link className="zn-odcard__ghost" href={routes.help('returns')}>
              شرایط مرجوعی
            </Link>
          </div>
        </section>

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
