/**
 * The things a customer may ask the shop to do with one of their orders.
 *
 * Server-only. Each write follows the same order, and the order is the point:
 *
 *   1. **Budget.** Rate-limited on the customer, before anything is read.
 *   2. **Ownership.** The order is found among the viewer's own rows; somebody
 *      else's is `not-found`, never «forbidden».
 *   3. **The rule, again.** `allowancesOf` is asked at the moment of writing.
 *      The page that offered the button may be an hour old.
 *   4. **Amounts from the record.** A refund is what the order says was paid,
 *      an instalment is what the schedule says is due. Nothing arrives in the
 *      request but choices.
 *   5. **One synchronous pass** from the check to the write, so two requests
 *      cannot both pass the same check — the shape a row lock takes once this
 *      is a database.
 */
import {
  CART_MAX_QUANTITY,
  type CancelOrderInput,
  type OrderMessageInput,
  type ReturnOrderInput,
  type ReviewOrderInput,
} from '@sharghigold/contracts';

import { newNumericCode } from '@/server/account/crypto';
import { consume } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  creditWallet,
  debitWallet,
  findOrderRow,
  newReturnCode,
  type OrderRecord,
} from '@/server/account/store';
import { addToCart } from '@/server/cart/cart';
import { release } from '@/server/inventory/stock';

import { allowancesOf } from './order-file';

type Refused =
  | { readonly status: 'not-found' }
  | { readonly status: 'not-allowed' }
  | { readonly status: 'throttled'; readonly retryAfterSeconds: number };

/** Steps 1 and 2, shared. */
function guarded(
  viewer: Viewer,
  bucket: Parameters<typeof consume>[0],
  code: string,
  now: Date,
): { readonly order: OrderRecord } | Refused {
  const budget = consume(bucket, viewer.customer.id, now);
  if (!budget.allowed) return { status: 'throttled', retryAfterSeconds: budget.retryAfterSeconds };

  const order = findOrderRow(viewer.customer.id, code);
  return order === undefined ? { status: 'not-found' } : { order };
}

/* -------------------------------------------------------------------------- */
/* Cancelling                                                                 */
/* -------------------------------------------------------------------------- */

export type CancelResult = { readonly status: 'cancelled' } | Refused;

/**
 * Cancel an order that has not left the workshop.
 *
 * Everything the customer paid goes back to the wallet — the total, or the
 * deposit and any instalments already taken — and the reserved stock goes
 * back on the shelf. The unpaid instalments stop being owed because the order
 * no longer stands; `allowancesOf` stops offering them.
 */
export function cancelOrder(
  viewer: Viewer,
  input: CancelOrderInput,
  now: Date = new Date(),
): CancelResult {
  const found = guarded(viewer, 'orders:cancel', input.code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  if (!allowancesOf(order, viewer.customer, now).cancel) return { status: 'not-allowed' };

  const refundRials =
    order.payment.paidRials +
    order.instalments.reduce(
      (sum, instalment) => (instalment.paidAt === null ? sum : sum + instalment.amountRials),
      0n,
    );
  const at = now.toISOString();

  order.state = 'cancelled';
  order.cancellation = { reason: input.reason, note: input.note, at, refundRials };
  order.events.push({ kind: 'cancelled', at, note: null });

  creditWallet(viewer.customer.id, refundRials, now, {
    kind: 'refund',
    label: 'بازگشت وجه سفارش لغوشده',
    reference: order.code,
  });
  order.events.push({ kind: 'refunded', at, note: 'به کیف پول زرنما' });

  release(order.reserved);
  return { status: 'cancelled' };
}

/* -------------------------------------------------------------------------- */
/* Returning                                                                  */
/* -------------------------------------------------------------------------- */

export type ReturnResult = { readonly status: 'requested' } | Refused;

/**
 * Ask to send pieces back.
 *
 * Nothing is refunded here. A request is read by a person, the piece is
 * collected and weighed, and only then does money move — which is what the
 * status page's four steps say. The refund figure is fixed now, from the lines
 * chosen, so the amount the customer is shown cannot drift while they wait.
 */
export function requestReturn(
  viewer: Viewer,
  input: ReturnOrderInput,
  now: Date = new Date(),
): ReturnResult {
  const found = guarded(viewer, 'orders:return', input.code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  const allowed = allowancesOf(order, viewer.customer, now);
  if (!allowed.requestReturn) return { status: 'not-allowed' };
  if (input.refundTo === 'bank' && !allowed.refundToBank) return { status: 'not-allowed' };
  if (input.lines.some((index) => order.lines[index] === undefined)) {
    return { status: 'not-allowed' };
  }

  const at = now.toISOString();
  const lineIndexes = input.lines.toSorted((left, right) => left - right);

  order.returnRequest = {
    code: newReturnCode(),
    stage: 'reviewing',
    lineIndexes,
    reason: input.reason,
    refundTo: input.refundTo,
    note: input.note,
    refundRials: lineIndexes.reduce(
      (sum, index) => sum + (order.lines[index]?.totalRials ?? 0n),
      0n,
    ),
    requestedAt: at,
  };
  order.events.push({ kind: 'return-requested', at, note: null });

  return { status: 'requested' };
}

export type WithdrawResult = { readonly status: 'withdrawn' } | Refused;

/** Take a return back, while nothing has been collected. */
export function withdrawReturn(
  viewer: Viewer,
  code: string,
  now: Date = new Date(),
): WithdrawResult {
  const found = guarded(viewer, 'orders:return', code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  const request = order.returnRequest;
  if (request === null || (request.stage !== 'reviewing' && request.stage !== 'collecting')) {
    return { status: 'not-allowed' };
  }

  request.stage = 'withdrawn';
  order.events.push({ kind: 'return-withdrawn', at: now.toISOString(), note: null });
  return { status: 'withdrawn' };
}

/* -------------------------------------------------------------------------- */
/* Reviewing                                                                  */
/* -------------------------------------------------------------------------- */

export type ReviewResult = { readonly status: 'submitted' } | Refused;

/**
 * Keep a review for moderation.
 *
 * Tied to a delivered order, which is the thing the product page's anonymous
 * review form cannot be. It is stored, not published: publishing is a
 * moderator's decision, and the confirmation screen says exactly that.
 */
export function reviewOrder(
  viewer: Viewer,
  input: ReviewOrderInput,
  now: Date = new Date(),
): ReviewResult {
  const found = guarded(viewer, 'orders:review', input.code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  if (!allowancesOf(order, viewer.customer, now).review) return { status: 'not-allowed' };
  // One rating per piece: fewer is a form that was tampered with, more is noise.
  if (input.ratings.length !== order.lines.length) return { status: 'not-allowed' };

  order.review = {
    ratings: input.ratings,
    body: input.body,
    tags: input.tags,
    anonymous: input.anonymous,
    submittedAt: now.toISOString(),
  };
  return { status: 'submitted' };
}

/* -------------------------------------------------------------------------- */
/* Talking to support                                                         */
/* -------------------------------------------------------------------------- */

const THREAD_LIMIT = 200;

export type MessageResult = { readonly status: 'sent' } | Refused;

/**
 * Add a message to the order's support thread.
 *
 * There is no automatic reply. A thread that answers itself «بررسی می‌کنم» a
 * second later tells a customer somebody read it when nobody did.
 */
export function postOrderMessage(
  viewer: Viewer,
  input: OrderMessageInput,
  now: Date = new Date(),
): MessageResult {
  const found = guarded(viewer, 'orders:message', input.code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  if (order.messages.length >= THREAD_LIMIT) return { status: 'not-allowed' };

  order.messages.push({ from: 'customer', body: input.body, at: now.toISOString() });
  return { status: 'sent' };
}

/* -------------------------------------------------------------------------- */
/* Paying an instalment                                                       */
/* -------------------------------------------------------------------------- */

export type InstalmentResult =
  | { readonly status: 'paid' }
  | { readonly status: 'insufficient-funds'; readonly shortRials: string }
  | Refused;

/**
 * Pay the earliest unpaid instalment from the wallet.
 *
 * Always the earliest: a customer cannot choose to pay March before February,
 * and the request names only the order, never the instalment or its amount.
 */
export function payNextInstalment(
  viewer: Viewer,
  code: string,
  now: Date = new Date(),
): InstalmentResult {
  const found = guarded(viewer, 'orders:instalment', code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  if (!allowancesOf(order, viewer.customer, now).payInstalment) return { status: 'not-allowed' };

  const index = order.instalments.findIndex((instalment) => instalment.paidAt === null);
  const next = order.instalments[index];
  if (next === undefined) return { status: 'not-allowed' };

  const paid = debitWallet(viewer.customer.id, next.amountRials, now, {
    label: `پرداخت قسط ${String(index + 1)} سفارش`,
    reference: order.code,
  });

  if (!paid) {
    return {
      status: 'insufficient-funds',
      shortRials: (next.amountRials - viewer.customer.walletRials).toString(),
    };
  }

  next.paidAt = now.toISOString();
  next.reference = newNumericCode(8);
  return { status: 'paid' };
}

/* -------------------------------------------------------------------------- */
/* Buying again                                                               */
/* -------------------------------------------------------------------------- */

export type ReorderResult =
  { readonly status: 'added'; readonly added: number; readonly skipped: number } | Refused;

/**
 * Put the order's pieces back in the basket, at today's price.
 *
 * Each piece goes through `addToCart`, so the size, colour and stock are
 * checked against the catalogue as it is now. A piece that is gone or sold out
 * is skipped and counted, not added at the price it cost last time.
 */
export async function reorder(
  viewer: Viewer,
  code: string,
  now: Date = new Date(),
): Promise<ReorderResult> {
  const found = guarded(viewer, 'orders:reorder', code, now);
  if (!('order' in found)) return found;
  const { order } = found;

  if (!allowancesOf(order, viewer.customer, now).reorder) return { status: 'not-allowed' };

  let added = 0;
  let skipped = 0;

  for (const line of order.lines) {
    if (line.productSlug === null || line.colour === null) {
      skipped += 1;
      continue;
    }

    const result = await addToCart(
      viewer,
      {
        productSlug: line.productSlug,
        size: line.size,
        colour: line.colour,
        quantity: Math.min(line.quantity, CART_MAX_QUANTITY),
      },
      now,
    );

    if (result.status === 'added') added += 1;
    else skipped += 1;
  }

  return { status: 'added', added, skipped };
}
