/**
 * The payment provider, as far as the shop is concerned.
 *
 * There is no provider. Zarnama has no merchant account, no callback URL and
 * no signing secret, so this module simulates one — and, like the account
 * store, refuses outright when `NODE_ENV` is `production` rather than
 * pretending to take money.
 *
 * What it is careful to get right is the *shape* of a real integration, since
 * that is what the surrounding code has to be correct against:
 *
 *   - Authorising returns an opaque handle. The amount is not part of it.
 *   - The outcome is decided by the provider, recorded on the provider's side,
 *     and read back by asking. The shop never receives an outcome as an
 *     argument from a browser, because in a real integration that is exactly
 *     the parameter an attacker forges.
 *   - Once a payment has ended, asking again gives the same answer. Settlement
 *     has to be idempotent, and it cannot be if the thing it reads is not. A
 *     payment that has *not* ended may answer «not yet» and then settle, which
 *     is the one thing a bank is allowed to change its mind about.
 *
 * The provider's records live under their own key on `globalThis`, deliberately
 * not in the shop's tables: code that could read the decision out of its own
 * store would be code that never learns to ask.
 */
import { randomBytes } from 'node:crypto';

export class PaymentsUnavailableError extends Error {
  override readonly name = 'PaymentsUnavailableError';
}

/** True while there is something that can stand in for a bank. */
export function paymentsAvailable(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function assertAvailable(): void {
  if (!paymentsAvailable()) {
    throw new PaymentsUnavailableError('پرداخت آنلاین در این محیط در دسترس نیست.');
  }
}

/** What a bank can tell us about a payment. */
export type PspOutcome = 'succeeded' | 'failed' | 'canceled' | 'pending';

const OUTCOMES: readonly PspOutcome[] = ['succeeded', 'failed', 'canceled', 'pending'];

export function isPspOutcome(value: string): value is PspOutcome {
  return (OUTCOMES as readonly string[]).includes(value);
}

interface Authorization {
  readonly authority: string;
  /** Decided when the payment is authorised, not when it is asked about. */
  outcome: PspOutcome;
  /** How many times the shop has asked. Only the staged delay reads it. */
  asks: number;
  readonly createdAt: string;
}

const LEDGER_KEY = Symbol.for('sharghigold.psp.authorizations');

interface GlobalWithLedger {
  [LEDGER_KEY]?: Map<string, Authorization>;
}

function ledger(): Map<string, Authorization> {
  const holder = globalThis as GlobalWithLedger;
  const existing = holder[LEDGER_KEY];
  if (existing !== undefined) return existing;

  const created = new Map<string, Authorization>();
  holder[LEDGER_KEY] = created;
  return created;
}

/**
 * Begin a payment and get the handle to ask about it with.
 *
 * `simulate` is how a reviewer sees the four result screens without four real
 * cards. It is the provider's own control, honoured only here and only in
 * development, and it is spent at authorisation time — so the answer to a
 * later «what happened» is already fixed and cannot be steered by whoever asks.
 */
export function authorize(simulate?: string, now: Date = new Date()): string {
  assertAvailable();

  const authority = randomBytes(16).toString('base64url');
  const outcome = simulate !== undefined && isPspOutcome(simulate) ? simulate : 'succeeded';

  ledger().set(authority, { authority, outcome, asks: 0, createdAt: now.toISOString() });
  return authority;
}

/**
 * What happened to the payment behind this handle.
 *
 * An unknown handle is `failed` rather than an error: a payment the provider
 * has never heard of is a payment that did not happen, and the wallet must not
 * be credited for it.
 *
 * A staged `pending` answers «not yet» once and then settles, which is what a
 * bank that is slow rather than broken does — and what makes «ask again» on
 * the receipt something a reviewer can actually see work. The decision is
 * still the provider's: the shop asks the same question both times and is told
 * different things, exactly as it would be in production.
 */
export function verify(authority: string): PspOutcome {
  assertAvailable();

  const found = ledger().get(authority);
  if (found === undefined) return 'failed';

  found.asks += 1;
  if (found.outcome === 'pending' && found.asks > 1) found.outcome = 'succeeded';

  return found.outcome;
}

/**
 * The customer pressed «cancel» at the bank.
 *
 * Recorded on the provider's side so that the shop's settlement step still
 * learns the outcome by asking, exactly as it would for any other ending.
 */
export function abandon(authority: string): void {
  assertAvailable();
  const found = ledger().get(authority);
  if (found !== undefined) found.outcome = 'canceled';
}

/** Throw the provider's records away. For tests, which must not share state. */
export function resetPaymentProvider(): void {
  const holder = globalThis as GlobalWithLedger;
  delete holder[LEDGER_KEY];
}
