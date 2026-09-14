/**
 * «درخواست تماس» — numbers a sales adviser has been asked to ring.
 *
 * The same care as the SMS list in `subscriptions.ts`, for the same reason: it
 * is a write anybody can post to without an account.
 *
 * - The number is parsed by the shared contract, so `+98912…` and `0912…` are
 *   one request, not two.
 * - Asking twice is not an error and answers exactly as asking once. A distinct
 *   «already requested» would let the form confirm whether a number is known.
 * - The topic is a closed set chosen by the page, never a field the client
 *   posts, so the queue cannot be filled with free text.
 *
 * Server-only and in-memory like every table in this build; the admin panel
 * reads `pendingCallbacks` when it exists.
 */
import { iranianMobileSchema } from '@sharghigold/contracts';

export type CallbackTopic = 'installment';

export type CallbackOutcome = { readonly status: 'requested' } | { readonly status: 'invalid' };

export interface CallbackRequest {
  readonly mobile: string;
  readonly topic: CallbackTopic;
  /** When it was last asked for. Asking again moves it, so a queue sorts fresh. */
  readonly at: string;
}

/** On `globalThis` so a dev-server module reload does not empty the queue. */
const KEY = Symbol.for('sharghigold.marketing.callbacks');

interface Holder {
  [KEY]?: Map<string, CallbackRequest>;
}

function queue(): Map<string, CallbackRequest> {
  const holder = globalThis as Holder;
  holder[KEY] ??= new Map();
  return holder[KEY];
}

/** Queue a call. `raw` is whatever was typed. */
export function requestCallback(
  raw: string,
  topic: CallbackTopic,
  now: Date = new Date(),
): CallbackOutcome {
  const parsed = iranianMobileSchema.safeParse(raw);

  if (!parsed.success) return { status: 'invalid' };

  const mobile = parsed.data;
  queue().set(`${topic}:${mobile}`, { mobile, topic, at: now.toISOString() });

  return { status: 'requested' };
}

/** Oldest first: the order an adviser should ring them in. */
export function pendingCallbacks(): readonly CallbackRequest[] {
  return [...queue().values()].toSorted((a, b) => a.at.localeCompare(b.at));
}

/** Empty the queue. Tests only. */
export function resetCallbacks(): void {
  queue().clear();
}
