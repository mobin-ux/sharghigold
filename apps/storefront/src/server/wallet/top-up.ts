import {
  paymentMethodSchema,
  topUpReceiptSchema,
  walletStateSchema,
  TOP_UP_MAX_RIALS,
  TOP_UP_MIN_RIALS,
  type PaymentMethod,
  type TopUpReceipt,
  type WalletState,
} from '@sharghigold/contracts';
import { RIALS_PER_TOMAN } from '@sharghigold/money';

import { ContractError } from '@/server/account/account';
import { newNumericCode } from '@/server/account/crypto';
import { consume } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  findPayment,
  insertPayment,
  listPayments,
  newPaymentId,
  settlePayment,
  type PaymentRecord,
} from '@/server/account/store';

import { abandon, authorize, verify } from './psp';

/**
 * Putting money into the wallet.
 *
 * Everything a payment is allowed to depend on is decided here, on the server,
 * and written down once:
 *
 *   - The amount is converted from tomans to rials as an integer and checked
 *     against the limits before a payment exists. After that it is read from
 *     the record and never from a request again.
 *   - Settlement asks the provider what happened. It is never told.
 *   - Settling is idempotent, because the page that triggers it is a page
 *     people refresh.
 *   - Every function takes a `Viewer` and resolves ids inside that viewer's
 *     own rows, so one customer cannot settle, read or cancel another's
 *     payment.
 */

function parsed<T>(result: { success: true; data: T } | { success: false }, what: string): T {
  if (!result.success) throw new ContractError(`${what} does not satisfy its contract`);
  return result.data;
}

/**
 * Tomans to rials, exactly.
 *
 * The customer types the unit the shop quotes in and the ledger holds the unit
 * the currency is defined in. Ten is an integer factor, so this is a
 * multiplication and not a conversion that can lose a digit.
 */
export function tomanToRials(toman: string): bigint {
  return BigInt(toman) * RIALS_PER_TOMAN;
}

export type StartResult =
  | { readonly status: 'started'; readonly id: string }
  | { readonly status: 'too-small' }
  | { readonly status: 'too-large' }
  | { readonly status: 'method-unavailable' }
  | { readonly status: 'throttled'; readonly retryAfterSeconds: number };

export interface StartInput {
  /** Latin digits, in tomans, already shape-checked by the contract. */
  readonly toman: string;
  readonly method: PaymentMethod;
  /** Development only: which ending the provider should stage. */
  readonly simulate?: string | undefined;
}

/**
 * Create a payment and hand back its id.
 *
 * The order matters. The limits are checked before the limiter is spent, so a
 * customer who mistypes an amount does not burn a slot; the method is checked
 * against what is actually built, because a control the page disables is a
 * control a request can still name.
 */
export function startTopUp(viewer: Viewer, input: StartInput, now: Date = new Date()): StartResult {
  const method = parsed(paymentMethodSchema.safeParse(input.method), 'payment method');
  if (method !== 'gateway') return { status: 'method-unavailable' };

  const amountRials = tomanToRials(input.toman);
  if (amountRials < TOP_UP_MIN_RIALS) return { status: 'too-small' };
  if (amountRials > TOP_UP_MAX_RIALS) return { status: 'too-large' };

  const budget = consume('wallet:topup', viewer.customer.id, now);
  if (!budget.allowed) {
    return { status: 'throttled', retryAfterSeconds: budget.retryAfterSeconds };
  }

  const record: PaymentRecord = {
    id: newPaymentId(),
    customerId: viewer.customer.id,
    reference: newNumericCode(8),
    amountRials,
    method,
    authority: authorize(input.simulate, now),
    status: 'pending',
    createdAt: now.toISOString(),
    settledAt: null,
    balanceAfterRials: null,
  };

  insertPayment(record);
  return { status: 'started', id: record.id };
}

function toReceipt(record: PaymentRecord): TopUpReceipt {
  return parsed(
    topUpReceiptSchema.safeParse({
      id: record.id,
      reference: record.reference,
      amountRials: String(record.amountRials),
      method: record.method,
      status: record.status,
      createdAt: record.createdAt,
      settledAt: record.settledAt,
      balanceAfterRials:
        record.balanceAfterRials === null ? null : String(record.balanceAfterRials),
    }),
    'top-up receipt',
  );
}

export function getReceipt(viewer: Viewer, id: string): TopUpReceipt | undefined {
  const record = findPayment(viewer.customer.id, id);
  return record === undefined ? undefined : toReceipt(record);
}

export function listReceipts(viewer: Viewer): readonly TopUpReceipt[] {
  return listPayments(viewer.customer.id).map(toReceipt);
}

/**
 * Ask the provider what happened, and apply it once.
 *
 * Called by the page the customer lands on coming back from the bank, which
 * they may land on twice — by refreshing, by pressing back, by opening the
 * link again an hour later. The second call re-reads the record and returns
 * the same receipt; the wallet is credited by the store, which refuses a
 * payment that is no longer pending.
 */
export function settleTopUp(
  viewer: Viewer,
  id: string,
  now: Date = new Date(),
): TopUpReceipt | undefined {
  const record = findPayment(viewer.customer.id, id);
  if (record === undefined) return undefined;
  if (record.status !== 'pending') return toReceipt(record);

  const outcome = verify(record.authority);
  // A payment the bank has not finished with stays pending: the wallet is not
  // credited on a maybe, and the page offers to ask again.
  if (outcome !== 'pending') settlePayment(record, outcome, now);

  return toReceipt(record);
}

/**
 * The customer pressed «cancel» while at the bank.
 *
 * Told to the provider rather than written straight into the shop's record, so
 * the outcome still arrives the way every other outcome does — by asking.
 */
export function cancelTopUp(
  viewer: Viewer,
  id: string,
  now: Date = new Date(),
): TopUpReceipt | undefined {
  const record = findPayment(viewer.customer.id, id);
  if (record === undefined) return undefined;
  if (record.status !== 'pending') return toReceipt(record);

  abandon(record.authority);
  return settleTopUp(viewer, id, now);
}

export function getWallet(viewer: Viewer): WalletState {
  return parsed(
    walletStateSchema.safeParse({
      balanceRials: String(viewer.customer.walletRials),
      goldMilligrams: String(viewer.customer.goldMilligrams),
    }),
    'wallet',
  );
}
