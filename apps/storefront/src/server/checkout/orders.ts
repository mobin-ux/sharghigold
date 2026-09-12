/**
 * Turning a basket into an order.
 *
 * This is the most dangerous function in the shop, so it is written to be read
 * in order. What it guarantees:
 *
 *   - **Nothing is charged that was not recomputed here.** The basket is
 *     re-priced from the catalogue and the locked rate at the moment of
 *     placing. No amount arrives from a request, and no amount computed by an
 *     earlier screen is reused.
 *   - **The price lock is enforced, not decorated.** An order placed against a
 *     rate that has expired is refused and the customer is sent back to
 *     refresh it, because honouring an expired lock is the shop paying the
 *     difference on every stale tab.
 *   - **Stock is taken for the whole basket or not at all**, before any money
 *     moves, and put straight back if the payment fails.
 *   - **The wallet is debited in one pass** that checks and deducts together,
 *     so two requests cannot both pass the same balance check.
 *   - **The outcome is asked of the provider, never received.** As with the
 *     wallet top-up, an outcome in a request body is the parameter an attacker
 *     forges.
 *   - **Submitting twice places one order.** The review screen's token is
 *     consumed inside the synchronous section; the second request is answered
 *     with the order the first one made.
 *
 * Every step that can fail returns a key, not a sentence. The screen writes
 * the Persian.
 */
import {
  placedOrderSchema,
  type CheckoutPayment,
  type PlacedOrder,
  type ProductDetail,
} from '@sharghigold/contracts';
import { rials, subtractRials, toPersianDigits, type Rials } from '@sharghigold/money';

import { ContractError } from '@/server/account/account';
import { newNumericCode } from '@/server/account/crypto';
import { consume } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  clearCart,
  creditWallet,
  debitWallet,
  findOrderSnapshot,
  insertOrderSnapshot,
  newOrderCode,
  pushOrderRow,
  retireDraft,
  type OrderSnapshotRecord,
} from '@/server/account/store';
import { lockExpired, priceCart } from '@/server/cart/cart';
import type { BasketQuote } from '@/server/cart/pricing';
import {
  chosenAddress,
  chosenBranch,
  chosenMonths,
  chosenShipping,
  chosenSlot,
  deliveryProblem,
  draftOf,
  paymentProblem,
  type CheckoutDraftRecord,
} from '@/server/checkout/draft';
import { release, reserve, type StockRequest } from '@/server/inventory/stock';
import { findShippingChoice } from '@/server/policy/checkout-policy';
import { priceInstallment } from '@/server/policy/installments';
import { authorize, paymentsAvailable, verify } from '@/server/wallet/psp';

const ZERO = rials(0n);

function parsed<T>(result: { success: true; data: T } | { success: false }, what: string): T {
  if (!result.success) throw new ContractError(`${what} does not satisfy its contract`);
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Labels the order keeps                                                     */
/* -------------------------------------------------------------------------- */

/**
 * How the order was paid for, in words, frozen onto the order.
 *
 * Written down rather than derived later from the draft, because the draft is
 * thrown away the moment the order exists — and a receipt that re-derives its
 * own wording is a receipt that can change.
 */
function paymentLabel(payment: CheckoutPayment, months: number): string {
  if (payment === 'wallet') return 'کیف پول زرنما';
  if (payment === 'installment') return `خرید اقساطی ${toPersianDigits(String(months))} ماهه`;
  return 'درگاه پرداخت بانکی';
}

function deliveryLabel(viewer: Viewer, draft: CheckoutDraftRecord): string {
  if (draft.mode === 'pickup') return chosenBranch(draft).title;

  const choice = findShippingChoice(chosenShipping(draft));
  const address = chosenAddress(viewer, draft);
  const city = address === undefined ? '' : ` — ${address.city}`;

  return `${choice?.title ?? 'ارسال'}${city}`.slice(0, 120) || 'ارسال';
}

function orderTitle(lines: readonly { readonly product: ProductDetail }[]): string {
  const first = lines[0]?.product.title ?? 'سفارش زرنما';
  return lines.length > 1
    ? `${first} و ${toPersianDigits(String(lines.length - 1))} قلم دیگر`.slice(0, 120)
    : first.slice(0, 120);
}

/* -------------------------------------------------------------------------- */
/* Placing                                                                    */
/* -------------------------------------------------------------------------- */

export type PlaceResult =
  | { readonly status: 'placed'; readonly code: string }
  /** The same token arrived twice. The first order is the answer. */
  | { readonly status: 'already-placed'; readonly code: string }
  | { readonly status: 'stale-intent' }
  | { readonly status: 'empty-basket' }
  | { readonly status: 'lock-expired' }
  | { readonly status: 'terms-required' }
  | { readonly status: 'delivery-incomplete' }
  | { readonly status: 'payment-incomplete' }
  | { readonly status: 'method-unavailable' }
  | { readonly status: 'out-of-stock'; readonly title: string }
  | { readonly status: 'insufficient-funds'; readonly shortRials: string }
  | { readonly status: 'throttled'; readonly retryAfterSeconds: number };

/**
 * What is owed today.
 *
 * The whole total for cash, the deposit for an instalment purchase. Computed
 * from the same policy the product page quotes from, so what checkout takes
 * and what the catalogue advertised cannot disagree.
 */
function payableNow(quote: BasketQuote, payment: CheckoutPayment, months: number): Rials {
  return payment === 'installment' ? priceInstallment(quote.total, months).deposit : quote.total;
}

export async function placeOrder(
  viewer: Viewer,
  intent: string,
  now: Date = new Date(),
): Promise<PlaceResult> {
  const draft = draftOf(viewer, now);

  // A repeat of the token that was actually spent is answered with the order
  // it made, before anything else is read — so a double tap cannot even reach
  // the rate limiter, let alone a second charge. A token from some other
  // render is simply stale; it is not answered with an unrelated order.
  if (draft.intent === null || draft.intent !== intent) {
    return draft.spentIntent === intent && draft.placedCode !== null
      ? { status: 'already-placed', code: draft.placedCode }
      : { status: 'stale-intent' };
  }

  const budget = consume('checkout:place', viewer.customer.id, now);
  if (!budget.allowed) {
    return { status: 'throttled', retryAfterSeconds: budget.retryAfterSeconds };
  }

  const payment = draft.payment;
  const months = chosenMonths(draft);

  if (payment !== 'wallet' && !paymentsAvailable()) return { status: 'method-unavailable' };

  const { cart, quote } = await priceCart(
    viewer,
    {
      mode: draft.mode,
      shipping: chosenShipping(draft),
      gift: draft.gift,
    },
    now,
  );

  if (quote.lines.length === 0) return { status: 'empty-basket' };
  if (lockExpired(cart, now)) return { status: 'lock-expired' };
  if (draft.termsAcceptedAt === null) return { status: 'terms-required' };
  if (deliveryProblem(viewer, draft, now) !== undefined) return { status: 'delivery-incomplete' };
  if (paymentProblem(draft) !== undefined) return { status: 'payment-incomplete' };
  if (draft.mode === 'pickup' && chosenSlot(draft, now) === undefined) {
    return { status: 'delivery-incomplete' };
  }

  const unsellable = quote.lines.find((line) => !line.orderable);
  if (unsellable !== undefined) return { status: 'out-of-stock', title: unsellable.product.title };

  /* ---- Nothing below here awaits. ------------------------------------- */
  /* From the token being spent to the order existing, this runs as one
     synchronous pass, so no second request can interleave with the stock
     reservation or the wallet debit. In a database each of the two writes is
     a transaction with its row locked; the shape is chosen so that
     substitution is all it takes. */

  // Spend the token, and remember that this is the one that was spent. A
  // repeat of it is answered with the order it made; anything else is stale.
  draft.intent = null;
  draft.spentIntent = intent;
  draft.placedCode = null;

  const wanted: readonly StockRequest[] = quote.lines.map((line) => ({
    productSlug: line.product.slug,
    quantity: line.quantity,
  }));

  const reserved = reserve(wanted);
  if (!reserved.ok) {
    const short = quote.lines.find((line) => line.product.slug === reserved.productSlug);
    return { status: 'out-of-stock', title: short?.product.title ?? 'یکی از کالاها' };
  }

  const payNow = payableNow(quote, payment, months);

  if (payment === 'wallet' && !debitWallet(viewer.customer.id, payNow, now)) {
    release(wanted);
    return {
      status: 'insufficient-funds',
      shortRials: subtractRials(payNow, rials(viewer.customer.walletRials)).toString(),
    };
  }

  // The staged ending is the simulated provider's own control, honoured only
  // where there is no bank, and spent at authorisation — so the answer to a
  // later «what happened» is fixed before anybody could steer it.
  const authority = payment === 'wallet' ? null : authorize(draft.simulate ?? undefined, now);

  const snapshot: OrderSnapshotRecord = insertOrderSnapshot({
    code: newOrderCode(),
    customerId: viewer.customer.id,
    placedAt: now.toISOString(),
    paymentState: 'pending',
    payment,
    paymentLabel: paymentLabel(payment, months),
    totalRials: quote.total,
    paidRials: payNow,
    itemCount: quote.lines.reduce((count, line) => count + line.quantity, 0),
    title: orderTitle(quote.lines),
    productSlug: quote.lines.length === 1 ? (quote.lines[0]?.product.slug ?? null) : null,
    deliveryMode: draft.mode,
    deliveryLabel: deliveryLabel(viewer, draft),
    authority,
    reference: null,
    failureReason: null,
    settledAt: null,
    reserved: wanted,
    walletDebitRials: payment === 'wallet' ? payNow : ZERO,
  });

  settleOrder(viewer, snapshot, now);

  // Recorded whatever the bank said. A customer who taps twice on a payment
  // that failed must be shown that failure, not asked to pay again.
  retireDraft(viewer.customer.id, snapshot.code, now);
  return { status: 'placed', code: snapshot.code };
}

/* -------------------------------------------------------------------------- */
/* Settling                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Ask what happened to the money, and apply it once.
 *
 * Split out from `placeOrder` deliberately. Today an order is placed and
 * settled in one request because there is no bank to be redirected to; when
 * there is, the customer comes back to a page that calls exactly this, and
 * nothing above it changes. It refuses an order that is no longer pending, so
 * calling it twice is safe — which it has to be, because the page that will
 * call it is a page people refresh.
 */
export function settleOrder(viewer: Viewer, snapshot: OrderSnapshotRecord, now: Date): void {
  if (snapshot.paymentState !== 'pending') return;

  // A wallet payment has no bank: the money moved inside the shop's own
  // ledger, in one pass that already succeeded. Everything else is asked.
  const outcome = snapshot.authority === null ? 'succeeded' : verify(snapshot.authority);
  if (outcome === 'pending') return;

  snapshot.settledAt = now.toISOString();

  if (outcome === 'succeeded') {
    snapshot.paymentState = 'paid';
    snapshot.reference = snapshot.authority === null ? null : newNumericCode(7);

    pushOrderRow({
      customerId: snapshot.customerId,
      code: snapshot.code,
      placedAt: snapshot.placedAt,
      state: 'processing',
      title: snapshot.title,
      totalRials: snapshot.totalRials,
      productSlug: snapshot.productSlug,
      itemCount: snapshot.itemCount,
    });

    // The basket is emptied only once the money is in. A payment that failed
    // leaves it exactly as it was, which is what the design's own failure
    // screen promises.
    clearCart(viewer.customer.id, now);
    return;
  }

  snapshot.paymentState = outcome === 'canceled' ? 'canceled' : 'failed';
  snapshot.failureReason = outcome === 'canceled' ? 'abandoned' : 'declined';

  // Everything the order took, given back: the stock it reserved and, if it
  // was paid from the wallet, the money it debited.
  release(snapshot.reserved);
  creditWallet(viewer.customer.id, snapshot.walletDebitRials, now);
}

/* -------------------------------------------------------------------------- */
/* Reading an order back                                                      */
/* -------------------------------------------------------------------------- */

function toPlacedOrder(snapshot: OrderSnapshotRecord): PlacedOrder {
  return parsed(
    placedOrderSchema.safeParse({
      code: snapshot.code,
      placedAt: snapshot.placedAt,
      paymentState: snapshot.paymentState,
      payment: snapshot.payment,
      paymentLabel: snapshot.paymentLabel,
      totalRials: snapshot.totalRials.toString(),
      paidRials: snapshot.paidRials.toString(),
      itemCount: snapshot.itemCount,
      deliveryMode: snapshot.deliveryMode,
      deliveryLabel: snapshot.deliveryLabel,
      reference: snapshot.reference,
      failureReason: snapshot.failureReason,
    }),
    'placed order',
  );
}

/** One order, scoped to its owner. Somebody else's is a 404, not a 403. */
export function getPlacedOrder(viewer: Viewer, code: string): PlacedOrder | undefined {
  const snapshot = findOrderSnapshot(viewer.customer.id, code);
  return snapshot === undefined ? undefined : toPlacedOrder(snapshot);
}
