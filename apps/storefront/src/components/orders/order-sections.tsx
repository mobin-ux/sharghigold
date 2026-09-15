import type { OrderFile } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';
import { OrderStepper } from '@sharghigold/ui';
import Link from 'next/link';

import { toman } from '@/lib/account-view';
import {
  dayMonth,
  dayMonthClock,
  dayMonthYear,
  EVENT_LABEL,
  fullDateClock,
  gramsLabel,
  instalmentState,
  instalmentWindow,
  lineSpec,
  liveReturn,
  mobileGroups,
  ORDER_STEP_LABELS,
  orderHeadline,
  orderStatus,
  stepperCurrent,
} from '@/lib/order-file-view';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';

import { OrderPill } from './order-chrome';
import { PayInstalmentButton, ReorderButton } from './order-forms';
import {
  ActionIcon,
  ChevronStartIcon,
  PieceIcon,
  TruckIcon,
  type OrderActionKey,
} from './order-icons';

/**
 * The sections of one order's page, top to bottom as the canvas draws them.
 *
 * Server Components: they draw an order file the gateway already decided. The
 * only islands are the two forms that change something — paying an instalment
 * and buying again.
 */

export function OrderHero({ order }: { readonly order: OrderFile }) {
  return (
    <section className="zn-ordhero" aria-label="وضعیت سفارش">
      <div className="zn-ordhero__row">
        <span className="zn-ordhero__pill">{orderStatus(order).label}</span>
        <span className="zn-ordhero__date">{`ثبت در ${dayMonthYear(order.placedAt)}`}</span>
      </div>
      <p className="zn-ordhero__text">{orderHeadline(order)}</p>
    </section>
  );
}

export function OrderProgress({ order }: { readonly order: OrderFile }) {
  if (order.state === 'cancelled') return null;

  return (
    <section className="zn-ordsec zn-ordsec--lift">
      <OrderStepper steps={ORDER_STEP_LABELS} current={stepperCurrent(order)} />
      {order.state === 'shipped' ? (
        <Link className="zn-ordbtn zn-ordbtn--track" href={routes.accountOrderTracking(order.code)}>
          <TruckIcon />
          پیگیری مرسوله
        </Link>
      ) : null}
    </section>
  );
}

export function OrderItems({ order }: { readonly order: OrderFile }) {
  return (
    <section className="zn-ordsec zn-ordsec--rows" aria-label="کالاهای سفارش">
      <ul className="zn-orditems">
        {order.lines.map((line) => (
          <li className="zn-orditem" key={line.index}>
            <span className="zn-ordthumb zn-ordthumb--54" aria-hidden="true">
              <PieceIcon />
            </span>
            <span className="zn-orditem__text">
              <span className="zn-orditem__title">
                {line.productSlug === null ? (
                  line.title
                ) : (
                  <Link href={routes.product(line.productSlug)}>{line.title}</Link>
                )}
              </span>
              <span className="zn-orditem__spec">{lineSpec(line)}</span>
              <span className="zn-orditem__qty">{`تعداد ${persianCount(line.quantity)}`}</span>
            </span>
            <span className="zn-orditem__price">
              <span className="zn-orditem__figure">{toman(line.totalRials)}</span>
              <span className="zn-orditem__unit">تومان</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The bill rows, shared by the order page and the invoice. */
export function billRows(
  order: OrderFile,
): readonly { label: string; value: string; free: boolean }[] {
  const { bill } = order;
  const rows = [
    {
      label: `ارزش طلا (${gramsLabel(bill.weightMilligrams)})`,
      value: toman(bill.goldValueRials),
      free: false,
    },
    { label: 'اجرت ساخت', value: toman(bill.makingFeeRials), free: false },
    { label: 'سود فروشنده', value: toman(bill.profitRials), free: false },
    { label: 'مالیات بر ارزش افزوده', value: toman(bill.vatRials), free: false },
  ];

  if (bill.discountRials !== '0') {
    rows.push({ label: 'تخفیف', value: `−${toman(bill.discountRials)}`, free: false });
  }
  if (bill.giftRials !== '0') {
    rows.push({ label: 'بسته‌بندی هدیه', value: toman(bill.giftRials), free: false });
  }
  if (order.delivery.mode === 'ship') {
    rows.push(
      bill.shippingRials === '0'
        ? { label: 'هزینه ارسال', value: 'رایگان', free: true }
        : { label: 'هزینه ارسال', value: toman(bill.shippingRials), free: false },
    );
  }

  return rows;
}

export function OrderBill({ order }: { readonly order: OrderFile }) {
  const instalment = order.instalments !== null;

  return (
    <section className="zn-ordsec" aria-labelledby="order-bill">
      <h2 className="zn-ordsec__title" id="order-bill">
        صورت‌حساب
      </h2>
      <ul className="zn-ordbill">
        {billRows(order).map((row) => (
          <li className="zn-ordbill__row" key={row.label}>
            <span className="zn-ordbill__label">{row.label}</span>
            <span className="zn-ordbill__rule" aria-hidden="true" />
            <span className={`zn-ordbill__value${row.free ? ' zn-ordbill__value--free' : ''}`}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="zn-ordbill__total">
        {/* An instalment order has not been paid in full, so it is not called
            «پرداخت‌شده». */}
        <span className="zn-ordbill__total-label">
          {instalment ? 'مبلغ کل سفارش' : 'مبلغ پرداخت‌شده'}
        </span>
        <span className="zn-ordbill__total-amount">
          <span className="zn-ordbill__total-figure">{toman(order.bill.totalRials)}</span>
          <span className="zn-ordbill__total-unit">تومان</span>
        </span>
      </div>
      {order.ratePerGramRials === null ? null : (
        <p className="zn-ordnote">
          نرخ طلای ۱۸ عیار در لحظه ثبت سفارش:{' '}
          <span className="zn-ordnote__figure">{toman(order.ratePerGramRials)}</span> تومان
        </p>
      )}
    </section>
  );
}

export function OrderPayment({ order, now }: { readonly order: OrderFile; readonly now: number }) {
  const plan = order.instalments;
  const paidCount = plan?.schedule.filter((instalment) => instalment.paidAt !== null).length ?? 0;

  return (
    <section className="zn-ordsec" aria-labelledby="order-payment" id="instalments">
      <h2 className="zn-ordsec__title" id="order-payment" data-gap="10">
        پرداخت
      </h2>
      <dl className="zn-ordpairs">
        <div className="zn-ordpair">
          <dt>روش</dt>
          <dd>{order.payment.label}</dd>
        </div>
        {order.payment.reference === null ? null : (
          <div className="zn-ordpair">
            <dt>کد رهگیری پرداخت</dt>
            <dd className="zn-ordpair__value--num">{toPersianDigits(order.payment.reference)}</dd>
          </div>
        )}
        {order.payment.paidAt === null ? null : (
          <div className="zn-ordpair">
            <dt>زمان</dt>
            <dd>{fullDateClock(order.payment.paidAt)}</dd>
          </div>
        )}
      </dl>

      {plan === null ? null : (
        <div className="zn-ordinst">
          <div className="zn-ordinst__head">
            <h3 className="zn-ordinst__title">اقساط</h3>
            <span className="zn-ordinst__meta">
              {`${persianCount(paidCount)} از ${persianCount(plan.months)} قسط پرداخت شده`}
            </span>
          </div>
          <ul className="zn-ordinst__list">
            {instalmentWindow(plan.schedule).map((instalment) => {
              const state =
                order.state === 'cancelled' && instalment.paidAt === null
                  ? { label: 'باطل شد', tone: 'idle' as const }
                  : instalmentState(instalment, now);
              return (
                <li className="zn-ordinst__row" key={instalment.number}>
                  <span
                    className={`zn-ordinst__dot zn-ordinst__dot--${state.tone}`}
                    aria-hidden="true"
                  />
                  <span className="zn-ordinst__label">
                    {`قسط ${persianCount(instalment.number)} — ${dayMonth(instalment.dueAt)}`}
                  </span>
                  <span className="zn-ordinst__amount">{toman(instalment.amountRials)}</span>
                  <OrderPill tone={state.tone}>{state.label}</OrderPill>
                </li>
              );
            })}
          </ul>
          {order.allowed.payInstalment ? (
            <PayInstalmentButton code={order.code} walletHref={routes.walletTopUp()} />
          ) : null}
        </div>
      )}
    </section>
  );
}

export function OrderAddress({ order }: { readonly order: OrderFile }) {
  const { delivery } = order;

  return (
    <section className="zn-ordsec" aria-labelledby="order-address">
      <h2 className="zn-ordsec__title" id="order-address" data-gap="9">
        {delivery.mode === 'pickup' ? 'تحویل حضوری' : 'نشانی تحویل'}
      </h2>
      <span className="zn-ordaddr__name">{delivery.recipientName ?? delivery.methodLabel}</span>
      <p className="zn-ordaddr__line">{delivery.addressLine ?? delivery.methodLabel}</p>
      <div className="zn-ordaddr__meta">
        {delivery.postalCode === null ? null : (
          <span>{`کد پستی ${toPersianDigits(delivery.postalCode)}`}</span>
        )}
        {delivery.recipientMobile === null ? null : (
          <span dir="ltr">{mobileGroups(delivery.recipientMobile)}</span>
        )}
      </div>
    </section>
  );
}

function ActionRow({
  href,
  icon,
  label,
  danger = false,
}: {
  readonly href: string;
  readonly icon: OrderActionKey;
  readonly label: string;
  readonly danger?: boolean;
}) {
  return (
    <li>
      <Link className={`zn-ordaction${danger ? ' zn-ordaction--danger' : ''}`} href={href}>
        <span className="zn-ordaction__icon">
          <ActionIcon name={icon} />
        </span>
        <span className="zn-ordaction__label">{label}</span>
        <span className="zn-ordaction__chevron">
          <ChevronStartIcon />
        </span>
      </Link>
    </li>
  );
}

/** Everything else the customer can do with this order, as the canvas lists it. */
export function OrderActions({ order }: { readonly order: OrderFile }) {
  const hasReturn = order.returnRequest !== null;

  return (
    <nav className="zn-ordsec zn-ordsec--rows" aria-label="کارهای این سفارش">
      <ul className="zn-ordactions">
        {order.state === 'cancelled' ? null : (
          <ActionRow
            href={routes.accountOrderTracking(order.code)}
            icon="track"
            label="پیگیری مرسوله"
          />
        )}
        {hasReturn && liveReturn(order) !== null ? (
          <ActionRow
            href={routes.accountOrderReturn(order.code)}
            icon="returnStatus"
            label="وضعیت درخواست مرجوعی"
          />
        ) : null}
        <ActionRow
          href={routes.accountOrderInvoice(order.code)}
          icon="invoice"
          label="مشاهده فاکتور"
        />
        {order.allowed.review ? (
          <ActionRow
            href={routes.accountOrderReview(order.code)}
            icon="review"
            label="ثبت نظر درباره کالا"
          />
        ) : null}
        {order.allowed.requestReturn ? (
          <ActionRow
            href={routes.accountOrderReturn(order.code)}
            icon="ret"
            label="درخواست مرجوعی"
          />
        ) : null}
        {order.allowed.reorder ? (
          <li>
            <ReorderButton code={order.code} variant="row">
              خرید دوباره
            </ReorderButton>
          </li>
        ) : null}
        <ActionRow
          href={routes.accountOrderSupport(order.code)}
          icon="support"
          label="گفت‌وگو با پشتیبانی"
        />
        {order.allowed.cancel ? (
          <ActionRow
            href={routes.accountOrderCancel(order.code)}
            icon="cancel"
            label="لغو سفارش"
            danger
          />
        ) : null}
      </ul>
    </nav>
  );
}

export function OrderEvents({ order }: { readonly order: OrderFile }) {
  return (
    <section className="zn-ordsec zn-ordsec--events" aria-labelledby="order-events">
      <h2 className="zn-ordsec__title" id="order-events" data-gap="14">
        رویدادهای مرسوله
      </h2>
      <ol className="zn-ordevents">
        {order.shipment.events.map((event, index) => (
          <li
            className={`zn-ordevent${event.at === null ? '' : ' zn-ordevent--done'}`}
            key={`${event.kind}-${index}`}
          >
            <span className="zn-ordevent__rail" aria-hidden="true">
              <span className="zn-ordevent__dot" />
              <span className="zn-ordevent__line" />
            </span>
            <span className="zn-ordevent__text">
              <span className="zn-ordevent__title">{EVENT_LABEL[event.kind]}</span>
              {event.at === null ? (
                <span className="zn-ordevent__when">در انتظار</span>
              ) : (
                <time className="zn-ordevent__when" dateTime={event.at}>
                  {dayMonthClock(event.at)}
                </time>
              )}
              {event.note === null ? null : <span className="zn-ordevent__note">{event.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
