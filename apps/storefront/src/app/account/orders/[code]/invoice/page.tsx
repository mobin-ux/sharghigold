import type { Metadata } from 'next';

import { OrderHeader } from '@/components/orders/order-chrome';
import { billRows } from '@/components/orders/order-sections';
import { PrintInvoice } from '@/components/orders/print-invoice';
import { BRAND } from '@/config/brand';
import { toman } from '@/lib/account-view';
import { dayMonthYear, lineSpec, orderCodeLabel } from '@/lib/order-file-view';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';

import '../../../account.css';
import '../../orders.css';
import { loadOrder } from '../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'فاکتور فروش',
  robots: { index: false, follow: false },
};

/**
 * «فاکتور فروش», drawn from the frozen order.
 *
 * Every figure is the one charged when the order was placed. The canvas prints
 * a national registration number for the shop; none is on record, so the line
 * says who issued the invoice without inventing one.
 */
export default async function OrderInvoicePage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { viewer, order } = await loadOrder(params);
  const buyer = order.delivery.recipientName ?? viewer.customer.displayName ?? 'مشتری زرنما';

  return (
    <div className="zn-shell">
      <OrderHeader back={routes.accountOrder(order.code)} title="فاکتور فروش" />

      <main>
        <section className="zn-ordsec zn-ordsec--flush" aria-label="فاکتور">
          <div className="zn-ordinv__head">
            <span className="zn-ordinv__mark" aria-hidden="true">
              {BRAND.name.charAt(0)}
            </span>
            <span className="zn-ordinv__brand">
              <span className="zn-ordinv__name">{`گالری طلای ${BRAND.legalName}`}</span>
              <span className="zn-ordinv__meta">{BRAND.tagline}</span>
            </span>
            <span className="zn-ordinv__code">{orderCodeLabel(order.code)}</span>
          </div>

          <dl className="zn-ordinv__party">
            <div>
              <dt>خریدار</dt>
              <dd>{buyer}</dd>
            </div>
            <div>
              <dt>تاریخ صدور</dt>
              <dd>{dayMonthYear(order.payment.paidAt ?? order.placedAt)}</dd>
            </div>
            <div>
              <dt>{order.delivery.mode === 'pickup' ? 'تحویل' : 'نشانی'}</dt>
              <dd className="zn-ordinv__addr">
                {order.delivery.addressLine ?? order.delivery.methodLabel}
              </dd>
            </div>
          </dl>

          <div className="zn-ordinv__body">
            <table className="zn-ordinv__table">
              <thead>
                <tr>
                  <th scope="col">شرح کالا</th>
                  <th scope="col" className="zn-ordinv__qty">
                    تعداد
                  </th>
                  <th scope="col" className="zn-ordinv__sum">
                    مبلغ (تومان)
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.index}>
                    <th scope="row" className="zn-ordinv__line">
                      {line.title}
                      <span className="zn-ordinv__piece-spec">{lineSpec(line)}</span>
                    </th>
                    <td className="zn-ordinv__qty">{persianCount(line.quantity)}</td>
                    <td className="zn-ordinv__sum">{toman(line.totalRials)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="zn-ordinv__bill">
              {billRows(order).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={row.free ? 'zn-ordbill__value--free' : undefined}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="zn-ordinv__total">
            <span className="zn-ordinv__total-label">مبلغ کل فاکتور</span>
            <span className="zn-ordinv__total-amount">
              <span className="zn-ordinv__total-figure">{toman(order.bill.totalRials)}</span>
              <span className="zn-ordinv__total-unit">تومان</span>
            </span>
          </div>
        </section>

        <div className="zn-ordpad">
          <PrintInvoice />
        </div>
        <div className="zn-ordtail" />
      </main>
    </div>
  );
}
