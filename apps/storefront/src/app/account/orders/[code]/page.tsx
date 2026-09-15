import type { Metadata } from 'next';

import { BottomNav } from '@/components/bottom-nav';
import { OrderHeader } from '@/components/orders/order-chrome';
import {
  OrderActions,
  OrderAddress,
  OrderBill,
  OrderHero,
  OrderItems,
  OrderPayment,
  OrderProgress,
} from '@/components/orders/order-sections';
import { orderCodeLabel } from '@/lib/order-file-view';
import { routes } from '@/lib/routes';

import '../../account.css';
import '../orders.css';
import { loadOrder } from './load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'جزئیات سفارش',
  // Never indexed: the page exists only for its owner, and its address holds
  // an order code.
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { order, now } = await loadOrder(params);

  return (
    <div className="zn-shell">
      <OrderHeader
        back={routes.accountOrders()}
        title="جزئیات سفارش"
        end={
          <span className="zn-ordhead__end zn-ordhead__end--code">
            {orderCodeLabel(order.code)}
          </span>
        }
      />

      <main>
        <OrderHero order={order} />
        <OrderProgress order={order} />
        <OrderItems order={order} />
        <OrderBill order={order} />
        <OrderPayment order={order} now={now.getTime()} />
        <OrderAddress order={order} />
        <OrderActions order={order} />
        <div className="zn-ordtail" />
      </main>

      <BottomNav />
    </div>
  );
}
