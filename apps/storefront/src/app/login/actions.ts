'use server';

import {
  iranianMobileSchema,
  otpCodeSchema,
  passwordSchema,
  setPasswordSchema,
} from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';
import { redirect } from 'next/navigation';

import { setPassword } from '@/server/account/account';
import { passwordMatches } from '@/server/account/crypto';
import {
  clearPending,
  destinationFor,
  getPending,
  requestCode,
  setPending,
  verifyCode,
  type OtpIntent,
} from '@/server/account/otp';
import { consume, reset } from '@/server/account/rate-limit';
import { getViewer, startSession } from '@/server/account/session';
import { accountsAvailable, findCustomerByMobile } from '@/server/account/store';

import type { CodeState, MobileState, PasswordState } from './state';

/** Read a field, latinising the digits an Iranian keyboard produces. */
function digits(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? toLatinDigits(raw) : '';
}

function text(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw : '';
}

/** Only the two the flow knows. Anything else is a sign-in. */
function intentOf(form: FormData): OtpIntent {
  return form.get('intent') === 'password' ? 'password' : 'signin';
}

/* -------------------------------------------------------------------------- */
/* Step one: the number                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Ask for a code.
 *
 * The response is the same whether or not the number has an account: the same
 * wording, the same redirect, the same timer. A form that answered differently
 * would let anyone test a list of numbers against the shop's customer base.
 *
 * The number is parsed here, on the server, against the shared contract — the
 * pattern on the input is a courtesy to somebody typing, not a control.
 */
export async function requestSignInCode(
  _previous: MobileState,
  form: FormData,
): Promise<MobileState> {
  const typed = digits(form, 'mobile');

  if (!accountsAvailable()) return { status: 'unavailable', mobile: typed };

  const mobile = iranianMobileSchema.safeParse(typed);
  if (!mobile.success) {
    return {
      status: 'invalid',
      message: 'شماره موبایل را با ۰۹ و در ۱۱ رقم وارد کنید.',
      mobile: typed,
    };
  }

  const outcome = requestCode(mobile.data);

  if (outcome.status === 'throttled') {
    return {
      status: 'throttled',
      message: `درخواست کد بیش از حد مجاز بود. ${minutesOrSeconds(outcome.retryAfterSeconds)} دیگر دوباره تلاش کنید.`,
      mobile: typed,
    };
  }

  await setPending({ mobile: mobile.data, intent: intentOf(form) });
  redirect('/login/verify');
}

function minutesOrSeconds(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes > 1 ? `${minutes} دقیقه` : `${Math.max(1, seconds)} ثانیه`;
}

/* -------------------------------------------------------------------------- */
/* Step two: the code                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Exchange a code for a session.
 *
 * Which number is being verified comes from the pending cookie, never from the
 * form. A number in the request body would let a caller point this at anybody's
 * account and spend their attempt budget guessing.
 */
export async function submitSignInCode(_previous: CodeState, form: FormData): Promise<CodeState> {
  const pending = await getPending();
  if (pending === undefined) redirect('/login');

  const code = otpCodeSchema.safeParse(digits(form, 'code'));
  if (!code.success) return { status: 'error', message: 'کد ۵ رقمی را کامل وارد کنید.' };

  const outcome = verifyCode(pending.mobile, code.data);

  switch (outcome.status) {
    case 'verified':
      await startSession(outcome.customer);
      await clearPending();
      redirect(`${destinationFor(pending.intent)}?done=welcome`);
      break;
    case 'wrong':
      return { status: 'error', message: 'کد واردشده درست نیست. دوباره تلاش کنید.' };
    case 'stale':
      return { status: 'error', message: 'این کد دیگر معتبر نیست. کد تازه‌ای بخواهید.' };
    default:
      return {
        status: 'error',
        message: `تلاش بیش از حد مجاز بود. ${minutesOrSeconds(outcome.retryAfterSeconds)} دیگر دوباره تلاش کنید.`,
      };
  }

  return { status: 'idle' };
}

/**
 * Send another code to the number already being verified.
 *
 * Returns to the same page either way. When the resend window is still open
 * the limiter refuses, and the page recomputes the countdown from it — so the
 * customer sees the seconds remaining rather than a sentence saying the same
 * thing. Nothing is claimed that did not happen.
 */
export async function resendSignInCode(_form: FormData): Promise<void> {
  const pending = await getPending();
  if (pending === undefined) redirect('/login');

  const outcome = requestCode(pending.mobile);

  redirect(outcome.status === 'sent' ? '/login/verify?done=code-sent' : '/login/verify');
}

/* -------------------------------------------------------------------------- */
/* The password path                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Sign in with a password.
 *
 * The failure is one message for every cause — no account, no password set,
 * wrong password — and the work is the same in each case, because a form that
 * answers faster for an unknown number answers the enumeration question with
 * timing instead of words.
 */
export async function submitPassword(
  _previous: PasswordState,
  form: FormData,
): Promise<PasswordState> {
  const pending = await getPending();
  if (pending === undefined) redirect('/login');

  const attempt = consume('password:login', pending.mobile);
  if (!attempt.allowed) {
    return {
      status: 'error',
      message: `تلاش بیش از حد مجاز بود. ${minutesOrSeconds(attempt.retryAfterSeconds)} دیگر دوباره تلاش کنید.`,
    };
  }

  const password = text(form, 'password');
  const customer = findCustomerByMobile(pending.mobile);
  const stored = customer?.passwordHash ?? null;

  // Hashed even when there is nothing to compare against, so a number with no
  // account is not distinguishable by how quickly it fails.
  const ok = await passwordMatches(password, stored ?? DUMMY_HASH);

  if (customer === undefined || stored === null || !ok) {
    return { status: 'error', message: 'شماره موبایل یا رمز عبور درست نیست.' };
  }

  reset('password:login', pending.mobile);
  await startSession(customer);
  await clearPending();
  redirect('/account?done=welcome');
}

/**
 * A real scrypt record over a value nobody holds.
 *
 * Comparing against this when no password is set makes the failing path cost
 * what the succeeding one costs. Its parameters match `hashPassword`, so the
 * work matches too.
 */
const DUMMY_HASH =
  'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

/**
 * Set or replace the password on the signed-in account.
 *
 * Reachable only with a session, and a session on this path is only ever
 * minutes old — the flow that leads here goes through a code sent to the
 * number on file. That is what makes «I forgot my password» safe: the reset is
 * authenticated by the same thing the account is.
 */
export async function submitNewPassword(
  _previous: PasswordState,
  form: FormData,
): Promise<PasswordState> {
  const viewer = await getViewer();
  if (viewer === undefined) redirect('/login');

  const parsed = setPasswordSchema.safeParse({
    password: text(form, 'password'),
    confirmation: text(form, 'confirmation'),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: 'error', message: first?.message ?? 'رمز عبور ثبت نشد.' };
  }

  // Parsed twice on purpose: the object schema above checks the pair, this
  // checks the value itself, and neither is the other's job.
  const value = passwordSchema.safeParse(parsed.data.password);
  if (!value.success) {
    return { status: 'error', message: value.error.issues[0]?.message ?? 'رمز عبور ثبت نشد.' };
  }

  await setPassword(viewer, value.data);
  redirect('/account?done=password-set');
}
