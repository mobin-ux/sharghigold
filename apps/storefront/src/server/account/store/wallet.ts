import { randomUUID } from 'node:crypto';

import { assertAvailable } from './availability';
import type { WalletEntryRecord } from './records';
import { tables } from './tables';

/**
 * Take money out of the wallet, or take none of it.
 *
 * The balance check and the deduction happen in one synchronous pass, for the
 * same reason `settlePayment` does: a check and a write with anything between
 * them is a balance two requests can both pass and both spend. When the
 * database replaces this, the pass becomes one transaction with the row
 * locked.
 *
 * Returns false when there is not enough. A negative wallet is not a state
 * this shop has, so it is refused rather than allowed and reported.
 */
export function debitWallet(
  customerId: string,
  amountRials: bigint,
  now: Date,
  entry: { readonly label: string; readonly reference: string | null } = {
    label: 'پرداخت سفارش',
    reference: null,
  },
): boolean {
  assertAvailable();

  if (amountRials < 0n) return false;

  const customer = tables().customers.get(customerId);
  if (customer === undefined) return false;
  if (customer.walletRials < amountRials) return false;

  customer.walletRials -= amountRials;
  customer.walletUpdatedAt = now.toISOString();

  // Written in the same pass as the balance change, never afterwards: a
  // ledger that can be skipped is a ledger that disagrees with the balance.
  if (amountRials > 0n) {
    appendWalletEntry({
      customerId,
      at: now.toISOString(),
      amountRials: -amountRials,
      balanceAfterRials: customer.walletRials,
      kind: 'order',
      label: entry.label,
      reference: entry.reference,
    });
  }

  return true;
}

/** Put money back, when the payment it was taken for did not happen. */
export function creditWallet(
  customerId: string,
  amountRials: bigint,
  now: Date,
  entry: {
    readonly kind: WalletEntryRecord['kind'];
    readonly label: string;
    readonly reference: string | null;
  } = {
    kind: 'refund',
    label: 'بازگشت وجه سفارش',
    reference: null,
  },
): void {
  assertAvailable();
  if (amountRials <= 0n) return;

  const customer = tables().customers.get(customerId);
  if (customer === undefined) return;

  customer.walletRials += amountRials;
  customer.walletUpdatedAt = now.toISOString();

  appendWalletEntry({
    customerId,
    at: now.toISOString(),
    amountRials,
    balanceAfterRials: customer.walletRials,
    kind: entry.kind,
    label: entry.label,
    reference: entry.reference,
  });
}

/**
 * Write one ledger row.
 *
 * Not re-exported from `store/index.ts`: only a balance change inside `store/`
 * may write the ledger, and it must do so in the same pass as that change.
 */
export function appendWalletEntry(entry: Omit<WalletEntryRecord, 'id'>): void {
  tables().walletEntries.push({ id: randomUUID(), ...entry });
}

/**
 * A customer's wallet movements, newest first.
 *
 * Filtered by customer inside the store, so no caller can ask for somebody
 * else's — there is no id to pass and therefore no id to get wrong.
 */
export function listWalletEntries(customerId: string): readonly WalletEntryRecord[] {
  assertAvailable();
  return tables()
    .walletEntries.filter((entry) => entry.customerId === customerId)
    .toSorted((left, right) => Date.parse(right.at) - Date.parse(left.at));
}
