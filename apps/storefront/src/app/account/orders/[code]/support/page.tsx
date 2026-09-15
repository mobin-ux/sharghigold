import type { Metadata } from 'next';

import { OrderHeader } from '@/components/orders/order-chrome';
import { SupportComposer } from '@/components/orders/order-forms';
import { SUPPORT } from '@/config/brand';
import { clock, dayMonthClock, orderCodeLabel, QUICK_ASKS } from '@/lib/order-file-view';
import { routes } from '@/lib/routes';

import '../../../account.css';
import '../../orders.css';
import { loadOrder } from '../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'پشتیبانی سفارش',
  robots: { index: false, follow: false },
};

/**
 * «پشتیبانی سفارش» — the order's own conversation.
 *
 * The canvas answers every message itself a second later and promises a reply
 * within ten minutes. Neither is true of a shop with no support desk wired to
 * this thread yet, so the page keeps what was sent, says where the answer will
 * appear, and offers the phone line for anything that cannot wait.
 */
export default async function OrderSupportPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { order, now } = await loadOrder(params);
  const today = dayMonthClock(now.toISOString()).split(' · ')[0];
  const last = order.messages.at(-1);

  return (
    <div className="zn-shell zn-shell--plain">
      <div className="zn-ordchat">
        <OrderHeader
          back={routes.accountOrder(order.code)}
          title="پشتیبانی سفارش"
          sub={orderCodeLabel(order.code)}
          end={
            <a
              className="zn-ordhead__end zn-ordhead__end--link"
              href={`tel:${SUPPORT.telephone}`}
              dir="ltr"
            >
              {SUPPORT.telephoneLabel}
            </a>
          }
        />

        <ol className="zn-ordthread" aria-label="پیام‌ها">
          <li className="zn-ordmsg">
            <span className="zn-ordmsg__bubble">
              <span>{`سلام، پشتیبانی زرنما در خدمت شماست. درباره سفارش ${orderCodeLabel(order.code)} چطور می‌توانیم کمکتان کنیم؟`}</span>
            </span>
          </li>
          {order.messages.map((message, index) => {
            const stamp = dayMonthClock(message.at);
            return (
              <li
                className={`zn-ordmsg${message.from === 'customer' ? ' zn-ordmsg--mine' : ''}`}
                key={`${message.at}-${index}`}
              >
                <span className="zn-ordmsg__bubble">
                  <span>{message.body}</span>
                  <time className="zn-ordmsg__when" dateTime={message.at}>
                    {stamp.startsWith(today ?? '') ? clock(message.at) : stamp}
                  </time>
                </span>
              </li>
            );
          })}
          {last?.from === 'customer' ? (
            <li className="zn-ordmsg">
              <span className="zn-ordmsg__bubble zn-ordmsg__bubble--quiet">
                <span>پیام شما ثبت شد. پاسخ پشتیبانی همین‌جا نمایش داده می‌شود.</span>
              </span>
            </li>
          ) : null}
        </ol>

        <SupportComposer code={order.code} asks={QUICK_ASKS} />
      </div>
    </div>
  );
}
