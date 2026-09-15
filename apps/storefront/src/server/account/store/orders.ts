import { newNumericCode } from '../crypto';

import { assertAvailable } from './availability';
import type { OrderRecord, OrderSnapshotRecord } from './records';
import { tables } from './tables';

/** A customer's paid orders, newest first. */
export function listOrders(customerId: string): readonly OrderRecord[] {
  assertAvailable();
  return tables()
    .orders.filter((order) => order.customerId === customerId)
    .toSorted((left, right) => Date.parse(right.placedAt) - Date.parse(left.placedAt));
}

/**
 * One order from the history, scoped to its owner.
 *
 * Returned as the live row: the lifecycle module changes its state in the same
 * synchronous pass that checks it, which is what a row lock does once this is a
 * database. Somebody else's order is `undefined`.
 */
export function findOrderRow(customerId: string, code: string): OrderRecord | undefined {
  assertAvailable();
  return tables().orders.find((order) => order.customerId === customerId && order.code === code);
}

/** A return reference no other return has. Random, for the order code's reason. */
export function newReturnCode(): string {
  assertAvailable();
  const taken = new Set(
    tables()
      .orders.map((order) => order.returnRequest?.code)
      .filter((code): code is string => code !== undefined),
  );

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = `RT-${newNumericCode(5)}`;
    if (!taken.has(code)) return code;
  }

  throw new Error('could not allocate a return code');
}

export function insertOrderSnapshot(record: OrderSnapshotRecord): OrderSnapshotRecord {
  assertAvailable();
  tables().placedOrders.set(record.code, record);
  return record;
}

/** One order, scoped to its owner. Somebody else's is `undefined`. */
export function findOrderSnapshot(
  customerId: string,
  code: string,
): OrderSnapshotRecord | undefined {
  assertAvailable();
  const found = tables().placedOrders.get(code);
  return found?.customerId === customerId ? found : undefined;
}

/**
 * Add a placed order to the customer's own list.
 *
 * Only paid orders reach it. An order whose payment failed is still readable
 * by its code — the result screen needs it — but it is not history, and a
 * failed charge sitting in «سفارش‌های من» is a customer ringing to ask what
 * they have been billed for.
 */
export function pushOrderRow(record: OrderRecord): void {
  assertAvailable();
  tables().orders.push(record);
}

/**
 * A code no order already has.
 *
 * Random rather than sequential: a sequential order number tells every
 * customer how many orders the shop takes, and makes the next one guessable —
 * which matters because a code is what a support call is keyed on. Ownership
 * is still checked on every read; this only stops the guessing being free.
 */
export function newOrderCode(): string {
  assertAvailable();
  const taken = tables().placedOrders;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = `ZN-${newNumericCode(5)}`;
    if (!taken.has(code)) return code;
  }

  throw new Error('could not allocate an order code');
}
