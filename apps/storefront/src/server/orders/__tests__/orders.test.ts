import { beforeEach, describe, expect, it } from 'vitest';

import { keyedDigest, newToken } from '@/server/account/crypto';
import { resetAllRateLimits } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  DEMO_MOBILE,
  findCart,
  findCustomerByMobile,
  insertSession,
  listWalletEntries,
  newSessionId,
  resetAccountStore,
  upsertCustomer,
  type CustomerRecord,
} from '@/server/account/store';
import { resetInventory } from '@/server/inventory/stock';
import {
  cancelOrder,
  payNextInstalment,
  postOrderMessage,
  reorder,
  requestReturn,
  reviewOrder,
  withdrawReturn,
} from '@/server/orders/lifecycle';
import { findOrderFile, listOrderFiles } from '@/server/orders/order-file';

/**
 * A customer's orders, and what they may ask for.
 *
 * Money moves back through these functions, so what is pinned is ownership,
 * the rules being re-checked at write time, and every amount coming from the
 * order record rather than the request.
 */

function viewerFor(customer: CustomerRecord): Viewer {
  const now = new Date();
  const session = insertSession({
    id: newSessionId(),
    customerId: customer.id,
    tokenHash: keyedDigest(newToken()),
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 3_600_000).toISOString(),
    revokedAt: null,
    userAgent: null,
    place: null,
  });
  return { customer, session };
}

function demo(): Viewer {
  const customer = findCustomerByMobile(DEMO_MOBILE);
  if (customer === undefined) throw new Error('demo customer not seeded');
  return viewerFor(customer);
}

function file(viewer: Viewer, code: string) {
  const found = findOrderFile(viewer, code);
  if (found === undefined) throw new Error(`no order ${code}`);
  return found;
}

beforeEach(() => {
  resetAccountStore();
  resetAllRateLimits();
  resetInventory();
});

describe('reading orders', () => {
  it('groups, searches and keeps totals that add up', () => {
    const viewer = demo();
    const all = listOrderFiles(viewer, { filter: 'all', q: undefined });
    expect(all.orders).toHaveLength(all.total);

    for (const order of all.orders) {
      const { bill } = order;
      const parts = [
        bill.goldValueRials,
        bill.makingFeeRials,
        bill.profitRials,
        bill.vatRials,
        bill.shippingRials,
        bill.giftRials,
      ].reduce((sum, part) => sum + BigInt(part), 0n);
      expect(parts - BigInt(bill.discountRials)).toBe(BigInt(bill.totalRials));
      expect(order.lines.reduce((sum, line) => sum + BigInt(line.totalRials), 0n)).toBe(
        BigInt(bill.totalRials) - BigInt(bill.shippingRials) - BigInt(bill.giftRials),
      );
    }

    expect(
      listOrderFiles(viewer, { filter: 'returns', q: undefined }).orders.map((o) => o.code),
    ).toEqual(['ZN-86770']);
    expect(listOrderFiles(viewer, { filter: 'all', q: '۸۸۴۱۲' }).orders.map((o) => o.code)).toEqual(
      ['ZN-88412'],
    );
    expect(
      listOrderFiles(viewer, { filter: 'all', q: 'انگشتر' }).orders.map((o) => o.code),
    ).toEqual(['ZN-88412']);
  });

  it('answers somebody else’s order exactly as a missing one', () => {
    const stranger = viewerFor(upsertCustomer('09121110000', new Date()));
    expect(findOrderFile(stranger, 'ZN-88412')).toBeUndefined();
    expect(findOrderFile(stranger, 'ZN-00000')).toBeUndefined();
    expect(listOrderFiles(stranger, { filter: 'all', q: undefined }).total).toBe(0);
  });

  it('lists the steps still to come after the ones that happened', () => {
    const events = file(demo(), 'ZN-88412').shipment.events;
    expect(events.filter((event) => event.at === null).map((event) => event.kind)).toEqual([
      'handed-to-carrier',
      'delivered',
    ]);
  });
});

describe('cancelling', () => {
  it('refunds what was paid to the wallet, once', () => {
    const viewer = demo();
    const before = viewer.customer.walletRials;
    const paid = BigInt(file(viewer, 'ZN-88412').payment.paidRials);

    expect(cancelOrder(viewer, { code: 'ZN-88412', reason: 'not-needed', note: null })).toEqual({
      status: 'cancelled',
    });
    expect(viewer.customer.walletRials - before).toBe(paid);
    expect(listWalletEntries(viewer.customer.id)[0]?.reference).toBe('ZN-88412');

    expect(cancelOrder(viewer, { code: 'ZN-88412', reason: 'not-needed', note: null }).status).toBe(
      'not-allowed',
    );
    expect(viewer.customer.walletRials - before).toBe(paid);
  });

  it('refuses an order that has left the workshop, or is not the customer’s', () => {
    const viewer = demo();
    expect(
      cancelOrder(viewer, { code: 'ZN-88103', reason: 'slow-delivery', note: null }).status,
    ).toBe('not-allowed');

    const stranger = viewerFor(upsertCustomer('09121110000', new Date()));
    expect(
      cancelOrder(stranger, { code: 'ZN-88412', reason: 'not-needed', note: null }).status,
    ).toBe('not-found');
  });
});

describe('returning', () => {
  const base = { code: 'ZN-87204', reason: 'size', refundTo: 'wallet', note: null } as const;

  it('fixes the refund from the chosen lines and can be withdrawn', () => {
    const viewer = demo();
    expect(requestReturn(viewer, { ...base, lines: [0] }).status).toBe('requested');

    const order = file(viewer, 'ZN-87204');
    expect(order.returnRequest?.refundRials).toBe(order.lines[0]?.totalRials);
    expect(order.allowed.requestReturn).toBe(false);
    expect(requestReturn(viewer, { ...base, lines: [0] }).status).toBe('not-allowed');

    expect(withdrawReturn(viewer, 'ZN-87204').status).toBe('withdrawn');
    expect(file(viewer, 'ZN-87204').allowed.requestReturn).toBe(true);
  });

  it('refuses a line the order does not have, a bank refund with no IBAN, and a late request', () => {
    const viewer = demo();
    expect(requestReturn(viewer, { ...base, lines: [3] }).status).toBe('not-allowed');
    expect(requestReturn(viewer, { ...base, lines: [0], refundTo: 'bank' }).status).toBe(
      'not-allowed',
    );

    const eightDaysOn = new Date(Date.now() + 8 * 86_400_000);
    expect(requestReturn(viewer, { ...base, lines: [0] }, eightDaysOn).status).toBe('not-allowed');
  });
});

describe('reviews, messages, instalments and buying again', () => {
  it('takes one rating per piece, once', () => {
    const viewer = demo();
    const review = { code: 'ZN-87204', body: null, tags: [], anonymous: true };
    expect(reviewOrder(viewer, { ...review, ratings: [5, 4] }).status).toBe('not-allowed');
    expect(reviewOrder(viewer, { ...review, ratings: [5] }).status).toBe('submitted');
    expect(reviewOrder(viewer, { ...review, ratings: [5] }).status).toBe('not-allowed');
    expect(reviewOrder(viewer, { ...review, code: 'ZN-88412', ratings: [5] }).status).toBe(
      'not-allowed',
    );
  });

  it('adds a message without inventing a reply', () => {
    const viewer = demo();
    expect(postOrderMessage(viewer, { code: 'ZN-88103', body: 'سلام' }).status).toBe('sent');
    expect(file(viewer, 'ZN-88103').messages).toEqual([
      expect.objectContaining({ from: 'customer', body: 'سلام' }),
    ]);
  });

  it('pays the earliest unpaid instalment from the wallet, or says what is short', () => {
    const viewer = demo();
    const schedule = file(viewer, 'ZN-85120').instalments?.schedule ?? [];
    const next = schedule.find((instalment) => instalment.paidAt === null);
    if (next === undefined) throw new Error('no unpaid instalment');

    viewer.customer.walletRials = 0n;
    const short = payNextInstalment(viewer, 'ZN-85120');
    expect(short).toEqual({ status: 'insufficient-funds', shortRials: next.amountRials });

    viewer.customer.walletRials = BigInt(next.amountRials);
    expect(payNextInstalment(viewer, 'ZN-85120').status).toBe('paid');
    expect(viewer.customer.walletRials).toBe(0n);
    const paid = file(viewer, 'ZN-85120').instalments?.schedule.find(
      (i) => i.number === next.number,
    );
    expect(paid?.paidAt).not.toBeNull();
  });

  it('puts pieces back in the basket through the catalogue, skipping what cannot be sold', async () => {
    const viewer = demo();
    expect((await reorder(viewer, 'ZN-88412')).status).toBe('not-allowed');

    // The half-set has no stock, so it is counted rather than added.
    expect(await reorder(viewer, 'ZN-85991')).toEqual({ status: 'added', added: 0, skipped: 1 });

    const before = findCart(viewer.customer.id)?.lines.find(
      (line) => line.productSlug === 'classic-solitaire-ring',
    )?.quantity;
    cancelOrder(viewer, { code: 'ZN-88412', reason: 'change-order', note: null });
    expect(await reorder(viewer, 'ZN-88412')).toEqual({ status: 'added', added: 1, skipped: 0 });
    expect(
      findCart(viewer.customer.id)?.lines.find(
        (line) => line.productSlug === 'classic-solitaire-ring',
      )?.quantity,
    ).toBe((before ?? 0) + 1);
  });
});
