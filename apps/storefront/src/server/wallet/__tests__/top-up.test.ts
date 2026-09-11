import { TOP_UP_MAX_RIALS, TOP_UP_MIN_RIALS } from '@sharghigold/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { keyedDigest, newToken } from '@/server/account/crypto';
import { resetAllRateLimits } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  DEMO_MOBILE,
  insertSession,
  newSessionId,
  resetAccountStore,
  upsertCustomer,
  type CustomerRecord,
} from '@/server/account/store';
import { resetPaymentProvider } from '@/server/wallet/psp';
import {
  cancelTopUp,
  getReceipt,
  getWallet,
  listReceipts,
  settleTopUp,
  startTopUp,
  tomanToRials,
} from '@/server/wallet/top-up';

/**
 * The part of the shop that moves money.
 *
 * What is pinned here is what would cost somebody real rials if it were wrong:
 * an amount that changes between being agreed and being charged, a wallet
 * credited twice for one payment, a wallet credited for a payment that failed,
 * and one customer reaching another's.
 */
const NOW = new Date('2026-09-11T09:00:00.000Z');
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1_000);

const OTHER_MOBILE = '09121110000';

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

function twoCustomers() {
  const mine = viewerFor(upsertCustomer(DEMO_MOBILE, NOW));
  const theirs = viewerFor(upsertCustomer(OTHER_MOBILE, NOW));
  return { mine, theirs };
}

/** Start a payment and fail loudly if it did not start. */
function start(viewer: Viewer, toman: string, simulate?: string, now: Date = NOW): string {
  const started = startTopUp(viewer, { toman, method: 'gateway', simulate }, now);
  if (started.status !== 'started') throw new Error(`expected a payment, got ${started.status}`);
  return started.id;
}

beforeEach(() => {
  resetAccountStore();
  resetPaymentProvider();
  resetAllRateLimits();
});

/* -------------------------------------------------------------------------- */
/* The amount                                                                 */
/* -------------------------------------------------------------------------- */

describe('converting what the customer typed', () => {
  it('multiplies by ten, exactly, at any magnitude', () => {
    expect(tomanToRials('50000')).toBe(500_000n);
    expect(tomanToRials('500000000')).toBe(5_000_000_000n);
    // Beyond what a double can hold without rounding.
    expect(tomanToRials('999999999999')).toBe(9_999_999_999_990n);
  });

  it('does not go through a number on the way', () => {
    // 9007199254740993 is the first integer a double cannot represent.
    expect(tomanToRials('900719925474099')).toBe(9_007_199_254_740_990n);
  });
});

describe('the limits', () => {
  it('refuses a rial below the floor and accepts the floor itself', () => {
    const { mine } = twoCustomers();
    expect(startTopUp(mine, { toman: '49999', method: 'gateway' }, NOW).status).toBe('too-small');
    expect(startTopUp(mine, { toman: '50000', method: 'gateway' }, NOW).status).toBe('started');
  });

  it('refuses a rial above the ceiling and accepts the ceiling itself', () => {
    const { mine } = twoCustomers();
    expect(startTopUp(mine, { toman: '500000001', method: 'gateway' }, NOW).status).toBe(
      'too-large',
    );
    expect(startTopUp(mine, { toman: '500000000', method: 'gateway' }, NOW).status).toBe('started');
  });

  it('checks the rial figure the contract states, not a copy of it', () => {
    const { mine } = twoCustomers();
    const id = start(mine, String(TOP_UP_MIN_RIALS / 10n));
    expect(getReceipt(mine, id)?.amountRials).toBe(String(TOP_UP_MIN_RIALS));

    const ceiling = start(mine, String(TOP_UP_MAX_RIALS / 10n));
    expect(getReceipt(mine, ceiling)?.amountRials).toBe(String(TOP_UP_MAX_RIALS));
  });

  it('refuses a method that is not built, whatever the page showed', () => {
    const { mine } = twoCustomers();
    const refused = startTopUp(mine, { toman: '5000000', method: 'card-to-card' }, NOW);
    expect(refused.status).toBe('method-unavailable');
  });

  it('does not spend the limiter on an amount it was never going to take', () => {
    const { mine } = twoCustomers();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(startTopUp(mine, { toman: '1', method: 'gateway' }, NOW).status).toBe('too-small');
    }
    expect(startTopUp(mine, { toman: '50000', method: 'gateway' }, NOW).status).toBe('started');
  });

  it('stops a customer opening payments in a loop', () => {
    const { mine } = twoCustomers();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(startTopUp(mine, { toman: '50000', method: 'gateway' }, NOW).status).toBe('started');
    }
    expect(startTopUp(mine, { toman: '50000', method: 'gateway' }, NOW).status).toBe('throttled');
  });
});

/* -------------------------------------------------------------------------- */
/* Settling                                                                   */
/* -------------------------------------------------------------------------- */

describe('settling a payment', () => {
  it('credits the wallet once, by the amount that was agreed', () => {
    const { mine } = twoCustomers();
    const before = BigInt(getWallet(mine).balanceRials);
    const id = start(mine, '5000000', 'succeeded');

    // Not credited until the bank has been asked.
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before);

    const receipt = settleTopUp(mine, id, later(10));
    expect(receipt?.status).toBe('succeeded');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before + 50_000_000n);
    expect(receipt?.balanceAfterRials).toBe(String(before + 50_000_000n));
  });

  it('does not credit twice however many times it is asked', () => {
    const { mine } = twoCustomers();
    const before = BigInt(getWallet(mine).balanceRials);
    const id = start(mine, '5000000', 'succeeded');

    const first = settleTopUp(mine, id, later(10));
    for (let again = 0; again < 5; again += 1) settleTopUp(mine, id, later(20 + again));

    expect(BigInt(getWallet(mine).balanceRials)).toBe(before + 50_000_000n);
    // And every answer is the same receipt, not a new one.
    expect(settleTopUp(mine, id, later(99))).toEqual(first);
  });

  it('credits nothing when the bank says the payment failed', () => {
    const { mine } = twoCustomers();
    const before = BigInt(getWallet(mine).balanceRials);
    const id = start(mine, '5000000', 'failed');

    expect(settleTopUp(mine, id, later(10))?.status).toBe('failed');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before);
    expect(getReceipt(mine, id)?.balanceAfterRials).toBeNull();
  });

  it('credits nothing when the customer cancelled at the bank', () => {
    const { mine } = twoCustomers();
    const before = BigInt(getWallet(mine).balanceRials);
    const id = start(mine, '5000000', 'canceled');

    expect(settleTopUp(mine, id, later(10))?.status).toBe('canceled');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before);
  });

  it('credits nothing while the bank has not answered', () => {
    const { mine } = twoCustomers();
    const before = BigInt(getWallet(mine).balanceRials);
    const id = start(mine, '5000000', 'pending');

    expect(settleTopUp(mine, id, later(10))?.status).toBe('pending');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before);

    // Asking again is the same question, and this time it is answered.
    expect(settleTopUp(mine, id, later(60))?.status).toBe('succeeded');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before + 50_000_000n);
  });

  it('takes a cancellation only while the payment is still open', () => {
    const { mine } = twoCustomers();
    const before = BigInt(getWallet(mine).balanceRials);

    const cancelled = start(mine, '5000000', 'succeeded');
    expect(cancelTopUp(mine, cancelled, later(5))?.status).toBe('canceled');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before);

    // A payment that already succeeded cannot be cancelled into a refund.
    const done = start(mine, '5000000', 'succeeded');
    settleTopUp(mine, done, later(10));
    expect(cancelTopUp(mine, done, later(20))?.status).toBe('succeeded');
    expect(BigInt(getWallet(mine).balanceRials)).toBe(before + 50_000_000n);
  });

  it('says nothing about a payment that does not exist', () => {
    const { mine } = twoCustomers();
    expect(settleTopUp(mine, '01997d1a-4c8e-7a31-9f60-2b5c7d0e41ff', NOW)).toBeUndefined();
    expect(getReceipt(mine, 'not-an-id')).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/* One customer cannot reach another's money                                  */
/* -------------------------------------------------------------------------- */

describe('scoping', () => {
  it('hides a payment from everybody but its owner', () => {
    const { mine, theirs } = twoCustomers();
    const id = start(theirs, '5000000', 'succeeded');

    expect(getReceipt(mine, id)).toBeUndefined();
    expect(listReceipts(mine)).toHaveLength(0);
    expect(listReceipts(theirs)).toHaveLength(1);
  });

  it('will not let one customer settle another’s payment into their own wallet', () => {
    const { mine, theirs } = twoCustomers();
    const mineBefore = BigInt(getWallet(mine).balanceRials);
    const theirsBefore = BigInt(getWallet(theirs).balanceRials);

    const id = start(theirs, '5000000', 'succeeded');
    expect(settleTopUp(mine, id, later(10))).toBeUndefined();

    expect(BigInt(getWallet(mine).balanceRials)).toBe(mineBefore);
    expect(BigInt(getWallet(theirs).balanceRials)).toBe(theirsBefore);
    expect(getReceipt(theirs, id)?.status).toBe('pending');
  });

  it('will not let one customer cancel another’s payment', () => {
    const { mine, theirs } = twoCustomers();
    const id = start(theirs, '5000000', 'succeeded');

    expect(cancelTopUp(mine, id, later(10))).toBeUndefined();
    expect(getReceipt(theirs, id)?.status).toBe('pending');
  });

  it('counts the limiter per customer, not for the shop', () => {
    const { mine, theirs } = twoCustomers();
    for (let attempt = 0; attempt < 12; attempt += 1) start(mine, '50000');

    expect(startTopUp(mine, { toman: '50000', method: 'gateway' }, NOW).status).toBe('throttled');
    expect(startTopUp(theirs, { toman: '50000', method: 'gateway' }, NOW).status).toBe('started');
  });
});

/* -------------------------------------------------------------------------- */
/* The receipt                                                                */
/* -------------------------------------------------------------------------- */

describe('the receipt', () => {
  it('gives every payment its own tracking number', () => {
    const { mine } = twoCustomers();
    const references = new Set(
      Array.from({ length: 8 }, () => getReceipt(mine, start(mine, '50000'))?.reference),
    );
    expect(references.size).toBe(8);
    for (const reference of references) expect(reference).toMatch(/^\d{8}$/);
  });

  it('reports the amount that was agreed, not one recomputed later', () => {
    const { mine } = twoCustomers();
    const id = start(mine, '1234567', 'succeeded');
    settleTopUp(mine, id, later(10));

    expect(getReceipt(mine, id)?.amountRials).toBe('12345670');
  });

  it('lists a customer’s payments newest first', () => {
    const { mine } = twoCustomers();
    start(mine, '50000', 'succeeded', NOW);
    start(mine, '60000', 'succeeded', later(60));
    start(mine, '70000', 'succeeded', later(120));

    expect(listReceipts(mine).map((receipt) => receipt.amountRials)).toEqual([
      '700000',
      '600000',
      '500000',
    ]);
  });
});
