import { cancelReasonSchema } from '@sharghigold/contracts';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { OrderHeader } from '@/components/orders/order-chrome';
import { CancelForm } from '@/components/orders/order-forms';
import { toman } from '@/lib/account-view';
import { CANCEL_REASON_LABEL } from '@/lib/order-file-view';
import { routes } from '@/lib/routes';

import '../../../account.css';
import '../../orders.css';
import { loadOrder } from '../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'لغو سفارش',
  robots: { index: false, follow: false },
};

/**
 * «لغو سفارش». Only while the order is in the workshop.
 *
 * The refund shown is what the order record says was paid — the total, or a
 * deposit plus the instalments taken — which is the figure the server will
 * credit. It is never posted back.
 */
export default async function CancelOrderPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { order } = await loadOrder(params);

  if (order.cancellation !== null) redirect(routes.accountOrderDone(order.code, 'cancelled'));
  if (!order.allowed.cancel) redirect(routes.accountOrder(order.code));

  const refund =
    BigInt(order.payment.paidRials) +
    (order.instalments?.schedule ?? []).reduce(
      (sum, instalment) =>
        instalment.paidAt === null ? sum : sum + BigInt(instalment.amountRials),
      0n,
    );

  return (
    <div className="zn-shell zn-shell--plain">
      <div className="zn-ordform">
        <OrderHeader back={routes.accountOrder(order.code)} title="لغو سفارش" />
        <CancelForm
          code={order.code}
          back={routes.accountOrder(order.code)}
          lead="تا پیش از تحویل به پست می‌توانید سفارش را لغو کنید. مبلغ پرداختی به کیف پول زرنما بازمی‌گردد."
          reasons={cancelReasonSchema.options.map((value) => ({
            value,
            label: CANCEL_REASON_LABEL[value],
          }))}
          refund={toman(refund.toString())}
        />
      </div>
    </div>
  );
}
