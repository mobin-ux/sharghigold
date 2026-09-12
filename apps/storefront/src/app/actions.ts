'use server';

import { toLatinDigits } from '@sharghigold/money';

import { consume } from '@/server/account/rate-limit';
import { subscribe } from '@/server/marketing/subscriptions';

/**
 * Actions that belong to no one route.
 *
 * Today that is the marketing sign-up, which sits in the footer of the
 * homepage and will sit in the footer of every page the marketing team asks
 * for. A Server Action rather than a `POST` route: the form needs no address
 * of its own, cannot be posted to cross-site, and gives its answer back into
 * the same render.
 */

/** What the panel shows after a submission. */
export type SubscribeState =
  | { readonly status: 'idle' }
  | { readonly status: 'done'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

const MESSAGES = {
  done: 'عضویت شما ثبت شد. هر هفته یک پیامک می‌فرستیم.',
  invalid: 'شماره موبایل معتبر نیست.',
  limited: 'درخواست‌های زیادی ثبت شد. کمی بعد دوباره تلاش کنید.',
} as const;

export async function subscribeToUpdates(
  _previous: SubscribeState,
  form: FormData,
): Promise<SubscribeState> {
  const raw = form.get('phone');
  const typed = typeof raw === 'string' ? toLatinDigits(raw.trim()) : '';

  // Bounded before anything else touches it. A field with no maximum is a
  // field somebody posts a megabyte to.
  if (typed.length === 0 || typed.length > 20) {
    return { status: 'error', message: MESSAGES.invalid };
  }

  // Counted against the number rather than the caller, the way the one-time
  // codes are: it is the only stable subject an unauthenticated form has, and
  // it is what stops one number being signed up in a loop.
  const budget = consume('marketing:subscribe', typed);
  if (!budget.allowed) return { status: 'error', message: MESSAGES.limited };

  const outcome = subscribe(typed);

  // «Already on the list» is deliberately not a distinct answer: it would make
  // this form a way to ask whether a given number is a customer.
  return outcome.status === 'subscribed'
    ? { status: 'done', message: MESSAGES.done }
    : { status: 'error', message: MESSAGES.invalid };
}
