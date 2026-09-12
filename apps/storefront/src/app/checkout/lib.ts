import { redirect } from 'next/navigation';
import type { Rials } from '@sharghigold/money';

import { requireViewer } from '@/server/account/session';
import type { CartRecord } from '@/server/account/store';
import { lockExpired, lockRemaining, priceCart } from '@/server/cart/cart';
import type { BasketQuote } from '@/server/cart/pricing';
import {
  chosenMonths,
  chosenShipping,
  draftOf,
  type CheckoutDraftRecord,
} from '@/server/checkout/draft';
import { priceInstallment } from '@/server/policy/installments';
import type { Viewer } from '@/server/account/session';

/**
 * What every checkout screen starts with.
 *
 * One place where the basket is re-priced against the draft's own choices, so
 * the three screens cannot show three different totals for the same order —
 * and one place where the two conditions that make a checkout meaningless are
 * checked. An empty basket and an expired price lock both send the customer
 * back to the basket, because there is nothing here to decide until one has
 * been fixed.
 *
 * The guard runs on every render rather than only on entry. A tab left open
 * while the lock ran out is a tab whose next press must not reach the payment
 * screen.
 */
export interface CheckoutContext {
  readonly viewer: Viewer;
  readonly draft: CheckoutDraftRecord;
  readonly cart: CartRecord;
  readonly quote: BasketQuote;
  /** What is owed today: the whole total, or the deposit on an instalment. */
  readonly payNow: Rials;
  readonly months: number;
  /** Seconds left on the basket's price lock, for the countdown. */
  readonly secondsRemaining: number;
  readonly now: Date;
}

export async function checkoutContext(now: Date = new Date()): Promise<CheckoutContext> {
  const viewer = await requireViewer();
  const draft = draftOf(viewer, now);

  const { cart, quote } = await priceCart(
    viewer,
    { mode: draft.mode, shipping: chosenShipping(draft), gift: draft.gift },
    now,
  );

  if (quote.lines.length === 0) redirect('/cart?problem=empty');
  if (lockExpired(cart, now)) redirect('/cart?problem=lock-expired');

  const months = chosenMonths(draft);
  const payNow =
    draft.payment === 'installment' ? priceInstallment(quote.total, months).deposit : quote.total;

  return {
    viewer,
    draft,
    cart,
    quote,
    payNow,
    months,
    secondsRemaining: lockRemaining(cart, now),
    now,
  };
}
