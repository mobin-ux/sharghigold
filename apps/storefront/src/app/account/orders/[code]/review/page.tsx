import { reviewTagSchema } from '@sharghigold/contracts';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { OrderHeader } from '@/components/orders/order-chrome';
import { ReviewForm } from '@/components/orders/order-forms';
import { RATING_WORDS, REVIEW_TAG_LABEL } from '@/lib/order-file-view';
import { routes } from '@/lib/routes';

import '../../../account.css';
import '../../orders.css';
import { loadOrder } from '../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ثبت نظر',
  robots: { index: false, follow: false },
};

export default async function OrderReviewPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { order } = await loadOrder(params);

  if (order.review !== null) redirect(routes.accountOrderDone(order.code, 'reviewed'));
  if (!order.allowed.review) redirect(routes.accountOrder(order.code));

  return (
    <div className="zn-shell zn-shell--plain">
      <div className="zn-ordform">
        <OrderHeader back={routes.accountOrder(order.code)} title="ثبت نظر" />
        <ReviewForm
          code={order.code}
          pieces={order.lines.map((line) => line.title)}
          tags={reviewTagSchema.options.map((value) => ({ value, label: REVIEW_TAG_LABEL[value] }))}
          ratingWords={RATING_WORDS}
        />
      </div>
    </div>
  );
}
