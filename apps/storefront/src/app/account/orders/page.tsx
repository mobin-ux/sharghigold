import { ORDER_SEARCH_MAX, parseOrderListQuery } from '@sharghigold/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';

import { BottomNav } from '@/components/bottom-nav';
import { OrderCard } from '@/components/orders/order-card';
import { OrderHeader } from '@/components/orders/order-chrome';
import { LensIcon, ReceiptIcon } from '@/components/orders/order-icons';
import { ORDER_GROUP_LABEL, ORDER_GROUPS } from '@/lib/order-file-view';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import { requireViewer } from '@/server/account/session';
import { listOrderFiles } from '@/server/orders/order-file';

import '../account.css';
import './orders.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'سفارش‌های من',
  robots: { index: false, follow: false },
};

/**
 * «سفارش‌های من».
 *
 * The canvas filters and searches in component state. Here both are the query
 * string — `?filter=shipped&q=انگشتر` — parsed by the closed contract parser,
 * so a filtered list is an address a customer can reload or send to support.
 * The search is a GET form: it works without a script and never sends the
 * whole order history to the browser to filter there.
 */
export default async function OrdersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const query = parseOrderListQuery(await searchParams);
  const { orders, total } = listOrderFiles(viewer, query);
  const unfiltered = query.filter === 'all' && query.q === undefined;

  return (
    <div className="zn-shell">
      <OrderHeader
        back={routes.account()}
        title="سفارش‌های من"
        end={<span className="zn-ordhead__end">{`${persianCount(total)} سفارش`}</span>}
      >
        <form className="zn-ordsearch" action={routes.accountOrders()} role="search">
          <LensIcon />
          {query.filter === 'all' ? null : (
            <input type="hidden" name="filter" value={query.filter} />
          )}
          <label className="sr-only" htmlFor="orders-q">
            جست‌وجو در سفارش‌ها
          </label>
          <input
            className="zn-ordsearch__input"
            id="orders-q"
            name="q"
            type="search"
            maxLength={ORDER_SEARCH_MAX}
            defaultValue={query.q ?? ''}
            placeholder="جست‌وجو در شماره سفارش یا کالا"
            enterKeyHint="search"
          />
        </form>
      </OrderHeader>

      <main>
        <nav className="zn-ordchips" aria-label="دسته‌بندی سفارش‌ها">
          {ORDER_GROUPS.map((group) => (
            <Link
              key={group}
              className="zn-ordchip"
              href={routes.accountOrders({ filter: group, q: query.q })}
              aria-current={group === query.filter ? 'true' : undefined}
            >
              {ORDER_GROUP_LABEL[group]}
            </Link>
          ))}
        </nav>

        {orders.length === 0 ? (
          <div className="zn-ordempty">
            <span className="zn-ordempty__glyph" aria-hidden="true">
              <ReceiptIcon />
            </span>
            <h2 className="zn-ordempty__title">
              {total === 0 || unfiltered ? 'هنوز سفارشی ثبت نکرده‌اید' : 'سفارشی پیدا نشد'}
            </h2>
            <p className="zn-ordempty__note">
              {total === 0 || unfiltered
                ? 'اولین قطعه‌ای که می‌پسندید را انتخاب کنید؛ سفارش‌هایتان اینجا دنبال می‌شوند.'
                : 'فیلتر یا عبارت جست‌وجو را تغییر دهید.'}
            </p>
            {total === 0 ? (
              <Link className="zn-ordempty__cta" href={routes.categories()}>
                شروع خرید
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="zn-ordlist">
            {orders.map((order) => (
              <OrderCard key={order.code} order={order} />
            ))}
          </div>
        )}

        <div className="zn-ordtail" />
      </main>

      <BottomNav />
    </div>
  );
}
