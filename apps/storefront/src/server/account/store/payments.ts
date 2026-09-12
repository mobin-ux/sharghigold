import { randomUUID } from 'node:crypto';

import type { PaymentStatus } from '@sharghigold/contracts';

import { assertAvailable } from './availability';
import type { PaymentRecord } from './records';
import { tables } from './tables';
import { appendWalletEntry } from './wallet';

export function insertPayment(record: PaymentRecord): PaymentRecord {
  assertAvailable();
  tables().payments.set(record.id, record);
  return record;
}

/**
 * One payment, scoped to its owner.
 *
 * The customer id is a parameter rather than a filter applied afterwards, so
 * there is no way to call this and forget it. A payment belonging to somebody
 * else is `undefined` — the same answer as one that does not exist.
 */
export function findPayment(customerId: string, id: string): PaymentRecord | undefined {
  assertAvailable();
  const found = tables().payments.get(id);
  return found?.customerId === customerId ? found : undefined;
}

export function listPayments(customerId: string): readonly PaymentRecord[] {
  assertAvailable();
  return [...tables().payments.values()]
    .filter((payment) => payment.customerId === customerId)
    .toSorted((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

/**
 * Move a payment to a terminal state, crediting the wallet if it succeeded.
 *
 * The status change and the credit happen together, in one synchronous pass
 * that nothing can interleave with, because the alternative is a wallet that
 * has been credited for a payment still marked pending — or credited twice.
 * When the database replaces this file the same pass becomes one transaction
 * with the payment row locked; the shape is chosen so that substitution is all
 * it takes.
 *
 * Returns false when the payment was already settled. That is not a failure:
 * it is what makes calling this twice safe, which it has to be, because a
 * customer who refreshes the bank's return page calls it twice.
 */
export function settlePayment(payment: PaymentRecord, status: PaymentStatus, now: Date): boolean {
  assertAvailable();

  if (payment.status !== 'pending') return false;

  const customer = tables().customers.get(payment.customerId);
  if (customer === undefined) return false;

  if (status === 'succeeded') {
    customer.walletRials += payment.amountRials;
    customer.walletUpdatedAt = now.toISOString();
    payment.balanceAfterRials = customer.walletRials;

    // In the same pass as the balance change, for the same reason the debit
    // is: a ledger written afterwards is a ledger that can be skipped.
    appendWalletEntry({
      customerId: payment.customerId,
      at: now.toISOString(),
      amountRials: payment.amountRials,
      balanceAfterRials: customer.walletRials,
      kind: 'top-up',
      label: 'افزایش موجودی کیف پول',
      reference: payment.reference,
    });
  }

  payment.status = status;
  payment.settledAt = now.toISOString();
  return true;
}

export function newPaymentId(): string {
  return randomUUID();
}
