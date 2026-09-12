import { randomUUID } from 'node:crypto';

import { assertAvailable } from './availability';
import type { CartRecord } from './records';
import { tables } from './tables';

/**
 * The customer's basket, created empty the first time it is asked for.
 *
 * Keyed by customer, so there is no id to pass and therefore no id to get
 * wrong. A basket belongs to exactly one account and cannot be addressed from
 * outside it.
 */
export function getOrCreateCart(customerId: string, rate: bigint, now: Date): CartRecord {
  assertAvailable();

  const existing = tables().carts.get(customerId);
  if (existing !== undefined) return existing;

  const created: CartRecord = {
    customerId,
    lines: [],
    saved: [],
    discountCode: null,
    ratePerGramRials: rate,
    rateQuotedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  tables().carts.set(customerId, created);
  return created;
}

export function findCart(customerId: string): CartRecord | undefined {
  assertAvailable();
  return tables().carts.get(customerId);
}

export function touchCart(cart: CartRecord, now: Date): void {
  cart.updatedAt = now.toISOString();
}

/** Empty a basket, keeping the record so its price lock stays where it was. */
export function clearCart(customerId: string, now: Date): void {
  assertAvailable();
  const cart = tables().carts.get(customerId);
  if (cart === undefined) return;

  cart.lines = [];
  cart.discountCode = null;
  cart.updatedAt = now.toISOString();
}

export function newCartLineId(): string {
  return randomUUID();
}
