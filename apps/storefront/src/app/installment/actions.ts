'use server';

import { toLatinDigits } from '@sharghigold/money';

import { consume } from '@/server/account/rate-limit';
import { requestCallback } from '@/server/marketing/callbacks';

import type { CallbackState } from './state';

const MESSAGES = {
  done: 'ثبت شد. کارشناس ما در ساعات کاری با شما تماس می‌گیرد.',
  invalid: 'شماره موبایل را با ۰۹ و ۱۱ رقم وارد کنید.',
  limited: 'درخواست‌های زیادی ثبت شد. کمی بعد دوباره تلاش کنید.',
} as const;

/**
 * «درخواست تماس» on the instalment page.
 *
 * Unauthenticated by design — the panel is for somebody deciding whether to
 * buy — so it is bounded, rate-limited against the number (the only stable
 * subject such a form has) and answers a repeat exactly as a first request.
 */
export async function requestInstallmentCallback(
  _previous: CallbackState,
  form: FormData,
): Promise<CallbackState> {
  const raw = form.get('phone');
  const typed = typeof raw === 'string' ? toLatinDigits(raw.trim()) : '';

  if (typed.length === 0 || typed.length > 20) {
    return { status: 'error', message: MESSAGES.invalid };
  }

  const budget = consume('marketing:callback', typed);
  if (!budget.allowed) return { status: 'error', message: MESSAGES.limited };

  return requestCallback(typed, 'installment').status === 'requested'
    ? { status: 'done', message: MESSAGES.done }
    : { status: 'error', message: MESSAGES.invalid };
}
