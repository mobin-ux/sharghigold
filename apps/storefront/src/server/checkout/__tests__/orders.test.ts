import { beforeEach, describe, expect, it } from 'vitest';

import { keyedDigest, newToken } from '@/server/account/crypto';
import { resetAllRateLimits } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  deleteAddress,
  DEMO_MOBILE,
  findCart,
  findOrderSnapshot,
  insertSession,
  listOrders,
  newSessionId,
  resetAccountStore,
  upsertCustomer,
  type CustomerRecord,
} from '@/server/account/store';
import { addToCart, priceCart, refreshRate, viewCart } from '@/server/cart/cart';
import {
  acceptTerms,
  chooseAddress,
  choosePayment,
  draftOf,
  issueIntent,
  setSimulatedOutcome,
} from '@/server/checkout/draft';
import { getPlacedOrder, placeOrder } from '@/server/checkout/orders';
import { available, resetInventory } from '@/server/inventory/stock';
import { resetPaymentProvider } from '@/server/wallet/psp';
import { getAddresses } from '@/server/account/account';

/**
 * Placing an order.
 *
 * This is where the shop takes money and gives away stock, so what is pinned
 * is every way that can go wrong: an order placed twice, a wallet spent twice,
 * stock taken for a payment that failed, a price honoured after its lock ran
 * out, and one customer reading another's order.
 */
const NOW = new Date('2026-09-12T09:00:00.000Z');
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1_000);

const OTHER_MOBILE = '09121110000';
const PLENTIFUL = 'classic-solitaire-ring';

function viewerFor(customer: CustomerRecord): Viewer {
  const session = insertSession({
    id: newSessionId(),
    customerId: customer.id,
    tokenHash: keyedDigest(newToken()),
    createdAt: NOW.toISOString(),
    lastSeenAt: NOW.toISOString(),
    expiresAt: later(3_600).toISOString(),
    revokedAt: null,
    userAgent: null,
    place: null,
  });
  return { customer, session };
}

/**
 * A customer with one ring in the basket, an address chosen and the terms
 * accepted — everything a valid order needs and nothing more.
 */
async function readyToPay(mobile: string = DEMO_MOBILE, outcome?: string): Promise<Viewer> {
  const viewer = viewerFor(upsertCustomer(mobile, NOW));

  const cart = findCart(viewer.customer.id);
  if (cart !== undefined) {
    cart.lines = [];
    cart.saved = [];
    cart.discountCode = null;
  }

  refreshRate(viewer, NOW);
  await addToCart(viewer, { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 }, NOW);

  const address = getAddresses(viewer)[0];
  if (address !== undefined) chooseAddress(viewer, address.id, NOW);
  acceptTerms(viewer, true, NOW);
  if (outcome !== undefined) setSimulatedOutcome(viewer, outcome, NOW);

  return viewer;
}

/** Place with a freshly minted token, which is what the review screen does. */
async function pay(viewer: Viewer, at: Date = later(10)) {
  return placeOrder(viewer, issueIntent(viewer, at), at);
}

beforeEach(() => {
  resetAccountStore();
  resetInventory();
  resetPaymentProvider();
  resetAllRateLimits();
});

/* -------------------------------------------------------------------------- */
/* The happy path                                                             */
/* -------------------------------------------------------------------------- */

describe('placing an order', () => {
  it('charges the figure the basket was priced at, and records it', async () => {
    const viewer = await readyToPay();
    const { quote } = await priceCart(viewer, {}, later(10));

    const placed = await pay(viewer);
    expect(placed.status).toBe('placed');
    if (placed.status !== 'placed') return;

    const order = getPlacedOrder(viewer, placed.code);
    expect(order?.paymentState).toBe('paid');
    // The order's total is what the basket came to, not a figure sent up.
    expect(order?.totalRials).toBe(quote.total.toString());
    expect(order?.paidRials).toBe(quote.total.toString());
  });

  it('empties the basket once the money is in, and not before', async () => {
    const viewer = await readyToPay();
    const placed = await pay(viewer);

    expect(placed.status).toBe('placed');
    expect((await viewCart(viewer, later(20))).lines).toHaveLength(0);
  });

  it('takes the stock it sold', async () => {
    const viewer = await readyToPay();
    const before = available(PLENTIFUL);

    await pay(viewer);
    expect(available(PLENTIFUL)).toBe(before - 1);
  });

  it('puts the order in the customer’s own list', async () => {
    const viewer = await readyToPay();
    const placed = await pay(viewer);
    if (placed.status !== 'placed') throw new Error('expected an order');

    expect(listOrders(viewer.customer.id).some((row) => row.code === placed.code)).toBe(true);
  });

  it('gives every order a tracking code of its own', async () => {
    const codes = new Set<string>();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      resetAccountStore();
      resetInventory();
      resetAllRateLimits();
      const viewer = await readyToPay();
      const placed = await pay(viewer);
      if (placed.status === 'placed') codes.add(placed.code);
    }

    expect(codes.size).toBe(4);
    for (const code of codes) expect(code).toMatch(/^ZN-\d{5}$/);
  });
});

/* -------------------------------------------------------------------------- */
/* Placing it twice                                                           */
/* -------------------------------------------------------------------------- */

describe('pressing pay twice', () => {
  it('places one order and answers the second press with it', async () => {
    const viewer = await readyToPay();
    const before = available(PLENTIFUL);

    const intent = issueIntent(viewer, later(10));
    const first = await placeOrder(viewer, intent, later(10));
    const second = await placeOrder(viewer, intent, later(11));

    expect(first.status).toBe('placed');
    expect(second.status).toBe('already-placed');
    if (first.status !== 'placed' || second.status !== 'already-placed') return;

    expect(second.code).toBe(first.code);
    // One order, one piece of stock.
    expect(available(PLENTIFUL)).toBe(before - 1);
  });

  it('refuses a token that was never issued', async () => {
    const viewer = await readyToPay();
    expect((await placeOrder(viewer, 'not-a-token', later(10))).status).toBe('stale-intent');
  });

  it('refuses a token that a later change to the order invalidated', async () => {
    const viewer = await readyToPay();
    const stale = issueIntent(viewer, later(10));

    // The customer went back and changed how they were paying.
    choosePayment(viewer, 'wallet', later(20));

    expect((await placeOrder(viewer, stale, later(30))).status).toBe('stale-intent');
  });
});

/* -------------------------------------------------------------------------- */
/* What stops an order                                                        */
/* -------------------------------------------------------------------------- */

describe('what an order is refused for', () => {
  it('will not honour a price lock that has run out', async () => {
    const viewer = await readyToPay();
    const late = later(400);

    expect((await placeOrder(viewer, issueIntent(viewer, late), late)).status).toBe('lock-expired');
    expect(available(PLENTIFUL)).toBe(5);
  });

  it('will not place an order the terms were not accepted for', async () => {
    const viewer = await readyToPay();
    acceptTerms(viewer, false, later(5));

    expect((await pay(viewer)).status).toBe('terms-required');
  });

  it('will not place an order with nothing in the basket', async () => {
    const viewer = await readyToPay();
    const cart = findCart(viewer.customer.id);
    if (cart !== undefined) cart.lines = [];

    expect((await pay(viewer)).status).toBe('empty-basket');
  });

  it('will not ship to an address the customer has not chosen', async () => {
    const viewer = await readyToPay();
    const draft = draftOf(viewer, later(5));
    draft.addressId = null;

    // Every address deleted, so there is nothing to fall back to either.
    for (const address of getAddresses(viewer)) {
      deleteAddress(viewer.customer.id, address.id);
    }

    expect((await pay(viewer)).status).toBe('delivery-incomplete');
  });

  it('stops a customer opening orders in a loop', async () => {
    const viewer = await readyToPay();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const cart = findCart(viewer.customer.id);
      if (cart !== undefined && cart.lines.length === 0) {
        await addToCart(
          viewer,
          { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 },
          NOW,
        );
      }
      acceptTerms(viewer, true, later(10));
      await pay(viewer, later(10 + attempt));
    }

    acceptTerms(viewer, true, later(30));
    expect((await pay(viewer, later(30))).status).toBe('throttled');
  });
});

/* -------------------------------------------------------------------------- */
/* When the money does not arrive                                             */
/* -------------------------------------------------------------------------- */

describe('a payment that fails', () => {
  it('gives the stock back and leaves the basket alone', async () => {
    const viewer = await readyToPay(DEMO_MOBILE, 'failed');
    const before = available(PLENTIFUL);

    const placed = await pay(viewer);
    if (placed.status !== 'placed') throw new Error('expected an order');

    const order = getPlacedOrder(viewer, placed.code);
    expect(order?.paymentState).toBe('failed');
    expect(order?.failureReason).toBe('declined');

    expect(available(PLENTIFUL)).toBe(before);
    expect((await viewCart(viewer, later(20))).lines).toHaveLength(1);
  });

  it('does the same when the customer cancelled at the bank', async () => {
    const viewer = await readyToPay(DEMO_MOBILE, 'canceled');
    const placed = await pay(viewer);
    if (placed.status !== 'placed') throw new Error('expected an order');

    const order = getPlacedOrder(viewer, placed.code);
    expect(order?.paymentState).toBe('canceled');
    expect(order?.failureReason).toBe('abandoned');
    expect((await viewCart(viewer, later(20))).lines).toHaveLength(1);
  });

  it('keeps a failed order out of the customer’s order history', async () => {
    const viewer = await readyToPay(DEMO_MOBILE, 'failed');
    const placed = await pay(viewer);
    if (placed.status !== 'placed') throw new Error('expected an order');

    // Readable by its code, because the result screen needs it — but not
    // history, because nothing was bought.
    expect(getPlacedOrder(viewer, placed.code)).toBeDefined();
    expect(listOrders(viewer.customer.id).some((row) => row.code === placed.code)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Paying from the wallet                                                     */
/* -------------------------------------------------------------------------- */

describe('paying from the wallet', () => {
  it('refuses when the balance does not cover the order, and takes nothing', async () => {
    const viewer = await readyToPay();
    choosePayment(viewer, 'wallet', later(5));
    acceptTerms(viewer, true, later(5));

    const before = viewer.customer.walletRials;
    const refused = await pay(viewer);

    expect(refused.status).toBe('insufficient-funds');
    expect(viewer.customer.walletRials).toBe(before);
    // And the stock it had reserved on the way is handed back.
    expect(available(PLENTIFUL)).toBe(5);
  });

  it('debits exactly once when it does cover it', async () => {
    const viewer = await readyToPay();
    viewer.customer.walletRials = 100_000_000_000n;
    choosePayment(viewer, 'wallet', later(5));
    acceptTerms(viewer, true, later(5));

    const { quote } = await priceCart(viewer, {}, later(10));
    const before = viewer.customer.walletRials;

    const intent = issueIntent(viewer, later(10));
    await placeOrder(viewer, intent, later(10));
    await placeOrder(viewer, intent, later(11));

    expect(before - viewer.customer.walletRials).toBe(quote.total);
  });
});

/* -------------------------------------------------------------------------- */
/* One customer cannot reach another's order                                  */
/* -------------------------------------------------------------------------- */

describe('scoping', () => {
  it('hides an order from everybody but its owner', async () => {
    const theirs = await readyToPay();
    const placed = await pay(theirs);
    if (placed.status !== 'placed') throw new Error('expected an order');

    const mine = viewerFor(upsertCustomer(OTHER_MOBILE, NOW));

    expect(getPlacedOrder(mine, placed.code)).toBeUndefined();
    expect(findOrderSnapshot(mine.customer.id, placed.code)).toBeUndefined();
    expect(getPlacedOrder(theirs, placed.code)).toBeDefined();
  });

  it('will not let a customer with no address of their own check out', async () => {
    // Only the demo account is seeded with addresses. A second customer has
    // none, and the delivery step is what stops them rather than an order
    // going nowhere.
    const stranger = await readyToPay(OTHER_MOBILE);
    expect((await pay(stranger)).status).toBe('delivery-incomplete');
  });
});
