import { orderQuerySchema } from '@sharghigold/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';

import { OrderCard } from '@/components/account/order-card';
import { PageHead } from '@/components/account/page-head';
import { InvoiceIcon } from '@/components/icons';
import { ORDER_FILTER_LABEL, ORDER_FILTERS } from '@/lib/account-view';
import { getOrders } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import '../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'سفارش‌های من',
  robots: { index: false, follow: false },
};

export default async function OrdersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();

  // Attacker-chosen text from the URL, parsed into a closed set before it
  // reaches anything. An unknown value falls back to «همه» rather than
  // erroring: a bad link should show the list, not a failure.
  const { filter } = orderQuerySchema.parse({
    filter: (await searchParams)['filter'],
  });

  const list = getOrders(viewer, filter);

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="سفارش‌های من" back="/account" />

      <main className="zn-orders">
        <nav className="zn-chips" aria-label="فیلتر سفارش‌ها">
          <ul className="zn-chips__list">
            {ORDER_FILTERS.map((option) => {
              const current = option === filter;
              return (
                <li key={option}>
                  <Link
                    className={`zn-chip${current ? ' zn-chip--on' : ''}`}
                    href={option === 'all' ? '/account/orders' : `/account/orders?filter=${option}`}
                    aria-current={current ? 'true' : undefined}
                  >
                    {ORDER_FILTER_LABEL[option]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {list.orders.length === 0 ? (
          <div className="zn-empty">
            <span className="zn-empty__glyph" aria-hidden="true">
              <InvoiceIcon size={26} strokeWidth={1.6} />
            </span>
            <p className="zn-empty__title">
              {list.total === 0 ? 'هنوز سفارشی ثبت نکرده‌اید' : 'سفارشی با این وضعیت ندارید'}
            </p>
            <p className="zn-empty__body">
              {list.total === 0
                ? 'اولین خریدتان اینجا نگهداری می‌شود و می‌توانید مرسوله را پیگیری کنید.'
                : 'فیلتر دیگری را امتحان کنید یا همه سفارش‌ها را ببینید.'}
            </p>
          </div>
        ) : (
          <div className="zn-orders__list">
            {list.orders.map((order) => (
              <OrderCard key={order.code} order={order} />
            ))}
          </div>
        )}

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
