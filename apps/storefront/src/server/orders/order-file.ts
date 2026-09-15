/**
 * The customer's orders, read.
 *
 * Server-only. Every function takes the `Viewer` and reads only that viewer's
 * rows, so an order code in a URL is looked up *within* the customer's own
 * history: somebody else's order is `undefined`, the same answer as one that
 * does not exist, and the page answers both with a 404.
 *
 * What a customer may do with an order is decided here, from the order's own
 * state, and `lifecycle.ts` asks the same functions again before it writes.
 * The page draws a button because a flag says so; the write happens because
 * the rule still holds when the request arrives.
 */
import {
  orderFileSchema,
  type OrderAllowances,
  type OrderEvent,
  type OrderEventKind,
  type OrderFile,
  type OrderGroup,
  type OrderListQuery,
} from '@sharghigold/contracts';

import { ContractError } from '@/server/account/account';
import type { Viewer } from '@/server/account/session';
import { listOrders, type CustomerRecord, type OrderRecord } from '@/server/account/store';

/** How long after delivery a piece may be sent back, in days. */
export const RETURN_WINDOW_DAYS = 7;

const DAY = 86_400_000;

/* -------------------------------------------------------------------------- */
/* Rules                                                                      */
/* -------------------------------------------------------------------------- */

export function hasUnpaidInstalment(order: OrderRecord): boolean {
  return order.instalments.some((instalment) => instalment.paidAt === null);
}

/**
 * What this order allows, now.
 *
 * - **Cancel** only before the parcel leaves the workshop. After that the
 *   piece is in a carrier's hands and the request is a return.
 * - **Return** within seven days of delivery, once per order unless a request
 *   was withdrawn. Instalment purchases are excluded: unwinding a credit
 *   agreement is a conversation with support, not a form.
 * - **Review** once, after delivery.
 * - **Buy again** when at least one piece is still in the catalogue.
 * - **Pay an instalment** while one is unpaid and the order stands.
 */
export function allowancesOf(
  order: OrderRecord,
  customer: CustomerRecord,
  now: Date,
): OrderAllowances {
  const deliveredAt = order.deliveredAt === null ? Number.NaN : Date.parse(order.deliveredAt);
  const withinWindow = now.getTime() - deliveredAt <= RETURN_WINDOW_DAYS * DAY;
  const openReturn = order.returnRequest !== null && order.returnRequest.stage !== 'withdrawn';

  return {
    cancel: order.state === 'processing' && order.cancellation === null,
    requestReturn:
      order.state === 'delivered' &&
      withinWindow &&
      !openReturn &&
      order.payment.method !== 'installment',
    review: order.state === 'delivered' && order.review === null,
    reorder:
      (order.state === 'delivered' || order.state === 'cancelled') &&
      order.lines.some((line) => line.productSlug !== null && line.colour !== null),
    payInstalment: order.state !== 'cancelled' && hasUnpaidInstalment(order),
    refundToBank: customer.iban !== null && customer.kycStatus === 'verified',
  };
}

/** Which chip an order sits under. A live return outranks the parcel's state. */
export function groupOf(order: OrderRecord): Exclude<OrderGroup, 'all'> {
  if (order.state === 'cancelled') return 'cancelled';
  if (order.returnRequest !== null && order.returnRequest.stage !== 'withdrawn') return 'returns';
  return order.state;
}

/**
 * The steps still to come, after what has happened.
 *
 * Derived rather than stored: only the past is a fact. What is expected next
 * depends on how the order is travelling, and a stored «pending» row is one
 * that goes on saying so after the parcel has arrived.
 */
function upcoming(order: OrderRecord): readonly OrderEventKind[] {
  const seen = new Set(order.events.map((event) => event.kind));
  const pending = (kinds: readonly OrderEventKind[]) => kinds.filter((kind) => !seen.has(kind));

  if (order.returnRequest !== null) {
    const stage = order.returnRequest.stage;
    if (stage === 'reviewing') return pending(['return-reviewed']);
    if (stage === 'collecting') return pending(['return-collected', 'return-refunded']);
    if (stage === 'inspecting') return pending(['return-refunded']);
    return [];
  }

  if (order.state === 'processing') {
    if (order.delivery.mode === 'pickup')
      return pending(['preparing', 'ready-for-pickup', 'delivered']);
    return pending(['preparing', 'handed-to-carrier', 'delivered']);
  }

  if (order.state === 'shipped') return pending(['out-for-delivery', 'delivered']);
  return [];
}

function eventsOf(order: OrderRecord): readonly OrderEvent[] {
  return [
    ...order.events.map((event) => ({ kind: event.kind, at: event.at, note: event.note })),
    ...upcoming(order).map((kind) => ({ kind, at: null, note: null })),
  ];
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export function toOrderFile(order: OrderRecord, customer: CustomerRecord, now: Date): OrderFile {
  const weight = order.lines.reduce((sum, line) => sum + line.weightMilligrams, 0n);

  const result = orderFileSchema.safeParse({
    code: order.code,
    placedAt: order.placedAt,
    state: order.state,
    ratePerGramRials: order.ratePerGramRials?.toString() ?? null,
    lines: order.lines.map((line, index) => ({
      index,
      productSlug: line.productSlug,
      title: line.title,
      size: line.size,
      colour: line.colour,
      weightMilligrams: line.weightMilligrams.toString(),
      quantity: line.quantity,
      totalRials: line.totalRials.toString(),
    })),
    bill: {
      weightMilligrams: weight.toString(),
      goldValueRials: order.bill.goldValueRials.toString(),
      makingFeeRials: order.bill.makingFeeRials.toString(),
      profitRials: order.bill.profitRials.toString(),
      vatRials: order.bill.vatRials.toString(),
      discountRials: order.bill.discountRials.toString(),
      shippingRials: order.bill.shippingRials.toString(),
      giftRials: order.bill.giftRials.toString(),
      totalRials: order.totalRials.toString(),
    },
    payment: {
      method: order.payment.method,
      label: order.payment.label,
      reference: order.payment.reference,
      paidAt: order.payment.paidAt,
      paidRials: order.payment.paidRials.toString(),
    },
    instalments:
      order.instalments.length === 0
        ? null
        : {
            months: order.instalments.length,
            depositRials: (order.depositRials ?? 0n).toString(),
            schedule: order.instalments.map((instalment, index) => ({
              number: index + 1,
              dueAt: instalment.dueAt,
              amountRials: instalment.amountRials.toString(),
              paidAt: instalment.paidAt,
            })),
          },
    delivery: order.delivery,
    shipment: {
      carrier: order.carrier,
      trackingCode: order.trackingCode,
      estimatedAt: order.estimatedAt,
      deliveredAt: order.deliveredAt,
      events: eventsOf(order),
    },
    cancellation:
      order.cancellation === null
        ? null
        : {
            reason: order.cancellation.reason,
            at: order.cancellation.at,
            refundRials: order.cancellation.refundRials.toString(),
          },
    returnRequest:
      order.returnRequest === null
        ? null
        : {
            code: order.returnRequest.code,
            stage: order.returnRequest.stage,
            lineIndexes: [...order.returnRequest.lineIndexes],
            reason: order.returnRequest.reason,
            refundTo: order.returnRequest.refundTo,
            refundRials: order.returnRequest.refundRials.toString(),
            requestedAt: order.returnRequest.requestedAt,
          },
    review:
      order.review === null
        ? null
        : { ratings: [...order.review.ratings], submittedAt: order.review.submittedAt },
    messages: order.messages,
    allowed: allowancesOf(order, customer, now),
  });

  if (!result.success) throw new ContractError('order file does not satisfy its contract');
  return result.data;
}

/**
 * The search the list's field runs.
 *
 * Folds Arabic letter forms and the zero-width non-joiner the way the magazine
 * search does, so «انگشتر» typed on an Arabic keyboard still finds the ring.
 * Matches the order code with or without its prefix, and any piece's title.
 */
export function normaliseOrderSearch(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matches(order: OrderRecord, term: string): boolean {
  const wanted = normaliseOrderSearch(term);
  if (wanted === '') return true;
  const haystack = [order.code, ...order.lines.map((line) => line.title)].map(normaliseOrderSearch);
  return haystack.some((text) => text.includes(wanted));
}

export interface OrderListing {
  readonly orders: readonly OrderFile[];
  /** Every order the customer has, before the chip and the search. */
  readonly total: number;
}

export function listOrderFiles(
  viewer: Viewer,
  query: OrderListQuery,
  now: Date = new Date(),
): OrderListing {
  const all = listOrders(viewer.customer.id);
  const kept = all.filter(
    (order) =>
      (query.filter === 'all' || groupOf(order) === query.filter) &&
      (query.q === undefined || matches(order, query.q)),
  );

  return {
    orders: kept.map((order) => toOrderFile(order, viewer.customer, now)),
    total: all.length,
  };
}

/** One order, or nothing. `code` is URL text; it only ever matches this viewer's rows. */
export function findOrderFile(
  viewer: Viewer,
  code: string,
  now: Date = new Date(),
): OrderFile | undefined {
  const order = listOrders(viewer.customer.id).find((row) => row.code === code);
  return order === undefined ? undefined : toOrderFile(order, viewer.customer, now);
}
