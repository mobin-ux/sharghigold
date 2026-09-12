/**
 * The SMS marketing list.
 *
 * The homepage has had a sign-up form since the homepage was built, with the
 * field disabled and a note saying the endpoint did not exist. It now does.
 *
 * Three things this is careful about, because it is the only write on the site
 * that does not require an account and so the only one anybody can post to.
 *
 * **The number is validated by the shared contract**, not by a regex written
 * here, so a number this accepts is a number the rest of the system accepts.
 *
 * **Signing up twice is not an error.** Re-subscribing an existing number
 * returns the same answer as a fresh one. The alternative tells whoever is
 * asking whether a given mobile number is already on the shop's list, which
 * makes the form an oracle for «is this person a customer».
 *
 * **Nothing is echoed back.** The confirmation does not repeat the number, so
 * a shared screen does not show it and a mistyped digit is not confirmed as
 * correct.
 *
 * Server-only, and in-memory like every other table in this build — the
 * production guard in `server/account/store.ts` is what keeps that honest.
 */
import { iranianMobileSchema } from '@sharghigold/contracts';

export type SubscribeOutcome =
  | { readonly status: 'subscribed' }
  | { readonly status: 'invalid' }
  | { readonly status: 'rate-limited' };

interface Subscription {
  readonly mobile: string;
  readonly at: string;
}

/**
 * Hung off `globalThis` for the same reason the account store is: the dev
 * server re-evaluates modules on every edit, and a plain module-level Map
 * would empty itself between two requests.
 */
const KEY = Symbol.for('sharghigold.marketing.subscriptions');

interface Holder {
  [KEY]?: Map<string, Subscription>;
}

function list(): Map<string, Subscription> {
  const holder = globalThis as Holder;
  holder[KEY] ??= new Map();
  return holder[KEY];
}

/**
 * Add a number to the list.
 *
 * `raw` is whatever was typed. It is parsed by the contract, which normalises
 * Persian digits and the several ways an Iranian mobile can be written, so the
 * same person typing `+98912…` and `0912…` lands on one row rather than two.
 */
export function subscribe(raw: string, now: Date = new Date()): SubscribeOutcome {
  const parsed = iranianMobileSchema.safeParse(raw);

  if (!parsed.success) return { status: 'invalid' };

  const mobile = parsed.data;

  // `set`, not «insert if absent»: re-subscribing refreshes the timestamp and
  // returns the same answer either way, so the form cannot be used to ask
  // whether a number is already on the list.
  list().set(mobile, { mobile, at: now.toISOString() });

  return { status: 'subscribed' };
}

/** How many numbers are on the list. For tests and, later, the admin panel. */
export function subscriberCount(): number {
  return list().size;
}

/** Empty the list. Tests only. */
export function resetSubscriptions(): void {
  list().clear();
}
