import { orderOutcomeSchema, type OrderFile, type OrderOutcome } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TickIcon } from '@/components/orders/order-icons';
import { toman } from '@/lib/account-view';
import {
  dayMonthYear,
  liveReturn,
  ORDER_OUTCOME_TITLE,
  orderCodeLabel,
  REFUND_DESTINATION,
} from '@/lib/order-file-view';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';

import '../../../../account.css';
import '../../../orders.css';
import { loadOrder } from '../../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'نتیجه درخواست',
  robots: { index: false, follow: false },
};

interface Outcome {
  readonly note: string;
  readonly rows: readonly (readonly [string, string])[];
  readonly primary: { readonly label: string; readonly href: string };
}

/**
 * What the confirmation says, read from the order — never from the URL.
 *
 * The address only names which confirmation to show. If the order holds no
 * such fact (nothing was cancelled, no instalment was paid), there is nothing
 * to confirm and the page sends the customer to the order instead.
 */
function outcomeOf(order: OrderFile, outcome: OrderOutcome): Outcome | undefined {
  const code = orderCodeLabel(order.code);

  switch (outcome) {
    case 'cancelled': {
      if (order.cancellation === null) return undefined;
      return {
        note: `سفارش ${code} لغو شد و مبلغ پرداختی به کیف پول زرنما بازگشت.`,
        rows: [
          ['مبلغ بازگشتی', `${toman(order.cancellation.refundRials)} تومان`],
          ['مقصد', 'کیف پول زرنما'],
          ['شماره سفارش', code],
        ],
        primary: { label: 'مشاهده کیف پول', href: routes.walletTransactions() },
      };
    }
    case 'returned': {
      const request = liveReturn(order);
      if (request === null) return undefined;
      const [first] = request.lineIndexes;
      const title = first === undefined ? '' : (order.lines[first]?.title ?? '');
      const more = request.lineIndexes.length - 1;
      return {
        note: 'کارشناس ما درخواست شما را بررسی می‌کند و برای دریافت کالا با شما هماهنگ می‌کند.',
        rows: [
          ['شماره درخواست', toPersianDigits(request.code)],
          ['کالا', more > 0 ? `${title} و ${persianCount(more)} کالای دیگر` : title],
          ['مبلغ بازگشتی', `${toman(request.refundRials)} تومان`],
          ['مقصد وجه', REFUND_DESTINATION[request.refundTo].label],
        ],
        primary: { label: 'پیگیری درخواست', href: routes.accountOrderReturn(order.code) },
      };
    }
    case 'reviewed': {
      if (order.review === null) return undefined;
      const [line] = order.lines;
      return {
        note: 'پس از بررسی کارشناسان، نظر شما در صفحه کالا منتشر می‌شود. ممنون که تجربه‌تان را نوشتید.',
        rows: [
          ['امتیاز', `${persianCount(order.review.ratings[0] ?? 0)} از ۵`],
          ['کالا', line?.title ?? ''],
        ],
        primary:
          line?.productSlug === null || line === undefined
            ? { label: 'بازگشت به سفارش', href: routes.accountOrder(order.code) }
            : { label: 'مشاهده صفحه کالا', href: routes.product(line.productSlug) },
      };
    }
    case 'instalment-paid': {
      const schedule = order.instalments?.schedule ?? [];
      const paid = schedule
        .filter((instalment) => instalment.paidAt !== null)
        .toSorted(
          (left, right) => Date.parse(right.paidAt ?? '') - Date.parse(left.paidAt ?? ''),
        )[0];
      if (paid === undefined) return undefined;
      const next = schedule.find((instalment) => instalment.paidAt === null);
      return {
        note: `قسط ${persianCount(paid.number)} سفارش ${code} از کیف پول شما پرداخت شد.`,
        rows: [
          ['مبلغ', `${toman(paid.amountRials)} تومان`],
          ['قسط بعدی', next === undefined ? 'همه اقساط پرداخت شده' : dayMonthYear(next.dueAt)],
        ],
        primary: { label: 'بازگشت به سفارش', href: routes.accountOrder(order.code) },
      };
    }
  }
}

export default async function OrderOutcomePage({
  params,
}: {
  readonly params: Promise<{ readonly code: string; readonly outcome: string }>;
}) {
  const { outcome: raw } = await params;
  const { order } = await loadOrder(params);
  const outcome = orderOutcomeSchema.safeParse(raw);
  const shown = outcome.success ? outcomeOf(order, outcome.data) : undefined;

  if (!outcome.success || shown === undefined) redirect(routes.accountOrder(order.code));

  return (
    <div className="zn-shell zn-shell--plain">
      <main className="zn-ordresult">
        <div className="zn-ordresult__main">
          <span className="zn-ordresult__glyph" aria-hidden="true">
            <TickIcon size={36} weight={2} />
          </span>
          <h1 className="zn-ordresult__title">{ORDER_OUTCOME_TITLE[outcome.data]}</h1>
          <p className="zn-ordresult__note">{shown.note}</p>
          <dl className="zn-ordresult__card">
            {shown.rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="zn-ordresult__actions">
          <Link className="zn-ordresult__primary" href={shown.primary.href}>
            {shown.primary.label}
          </Link>
          <Link className="zn-ordbtn zn-ordbtn--wide" href={routes.accountOrders()}>
            بازگشت به سفارش‌ها
          </Link>
        </div>
      </main>
    </div>
  );
}
