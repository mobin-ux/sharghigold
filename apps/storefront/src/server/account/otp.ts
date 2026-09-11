/**
 * The one-time code that signs a customer in.
 *
 * Server-only. Five digits is a hundred thousand possibilities, which is not a
 * secret on its own — it is a secret because of everything around it, and that
 * is what this file is:
 *
 * - **A short life.** Two minutes by default, from `OTP_TTL_SECONDS`.
 * - **A count.** Five wrong guesses burn the challenge. The counter is on the
 *   challenge, so it cannot be reset by asking for the code again.
 * - **A budget.** One code a minute, three in ten minutes, ten verifications
 *   in ten minutes, all keyed on the number rather than on anything the caller
 *   controls (rule 13).
 * - **One use.** A verified challenge is deleted, not marked. There is nothing
 *   left to replay.
 * - **Nothing to compare against.** Only a keyed hash is stored, and the
 *   comparison is constant-time.
 *
 * What the caller learns is deliberately the same whether or not an account
 * exists for that number, and whether a code was wrong or expired is only told
 * apart because the customer needs to know whether to retype or resend — never
 * whether the number is registered. A sign-in form that answers that question
 * is an account enumeration oracle.
 */
import { cookies } from 'next/headers';

import { digestsMatch, keyedDigest, newNumericCode } from './crypto';
import { consume, reset } from './rate-limit';
import {
  assertAvailable,
  dropChallenge,
  findChallenge,
  putChallenge,
  upsertCustomer,
  type CustomerRecord,
} from './store';

export const OTP_DIGITS = 5;
const MAX_ATTEMPTS = 5;
const DEFAULT_TTL_SECONDS = 120;

function ttlSeconds(): number {
  const configured = Number(process.env['OTP_TTL_SECONDS']);
  return Number.isInteger(configured) && configured >= 30 && configured <= 600
    ? configured
    : DEFAULT_TTL_SECONDS;
}

/* -------------------------------------------------------------------------- */
/* Where the customer goes once the code checks out                           */
/* -------------------------------------------------------------------------- */

/**
 * The reason a code was asked for.
 *
 * An enum, not a path. Carrying the destination as a URL — even in an
 * HttpOnly cookie — is an open redirect waiting to be found; carrying a key
 * that the server maps to a fixed route cannot be one (rule 12).
 */
export type OtpIntent = 'signin' | 'password';

export function destinationFor(intent: OtpIntent): string {
  return intent === 'password' ? '/login/password/new' : '/account';
}

/* -------------------------------------------------------------------------- */
/* The pending challenge, remembered between two requests                     */
/* -------------------------------------------------------------------------- */

const PENDING_COOKIE = 'zn_otp';

export interface PendingChallenge {
  readonly mobile: string;
  readonly intent: OtpIntent;
}

/**
 * Read the cookie back into a value, or into nothing.
 *
 * Hand-written rather than a schema because the storefront does not depend on
 * a validation library — the contracts package owns every schema that crosses
 * the wire, and this never leaves the server. Both fields are still checked:
 * a cookie is input, whatever set it.
 */
function readPending(raw: string): PendingChallenge | undefined {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = value as { mobile?: unknown; intent?: unknown };

  if (typeof candidate.mobile !== 'string' || !/^09\d{9}$/u.test(candidate.mobile)) {
    return undefined;
  }
  if (candidate.intent !== 'signin' && candidate.intent !== 'password') return undefined;

  return { mobile: candidate.mobile, intent: candidate.intent };
}

/**
 * Remember which number is being verified.
 *
 * In a cookie rather than in the URL. A number in the query string is a number
 * anybody can substitute, which would turn the verify page into a place to
 * guess at somebody else's code — the limits below would hold, but the page
 * should not offer the attempt in the first place.
 */
export async function setPending(pending: PendingChallenge): Promise<void> {
  (await cookies()).set(PENDING_COOKIE, JSON.stringify(pending), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
}

export async function getPending(): Promise<PendingChallenge | undefined> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  return raw === undefined ? undefined : readPending(raw);
}

export async function clearPending(): Promise<void> {
  (await cookies()).delete(PENDING_COOKIE);
}

/* -------------------------------------------------------------------------- */
/* Asking for a code                                                          */
/* -------------------------------------------------------------------------- */

export type RequestOutcome =
  | {
      readonly status: 'sent';
      /** Seconds before another code may be asked for. */
      readonly retryAfterSeconds: number;
      readonly expiresInSeconds: number;
    }
  | { readonly status: 'throttled'; readonly retryAfterSeconds: number };

/**
 * Issue a code for `mobile` and hand it to the SMS transport.
 *
 * The account is created here if there is none, so that verification has
 * something to sign in to and the response cannot differ between a known and
 * an unknown number.
 */
export function requestCode(mobile: string, now: Date = new Date()): RequestOutcome {
  assertAvailable();

  const resend = consume('otp:resend', mobile, now);
  if (!resend.allowed) {
    return { status: 'throttled', retryAfterSeconds: resend.retryAfterSeconds };
  }

  const budget = consume('otp:request', mobile, now);
  if (!budget.allowed) {
    return { status: 'throttled', retryAfterSeconds: budget.retryAfterSeconds };
  }

  upsertCustomer(mobile, now);

  const code = newNumericCode(OTP_DIGITS);
  const ttl = ttlSeconds();

  putChallenge({
    mobile,
    codeHash: keyedDigest(`${mobile}:${code}`),
    expiresAt: new Date(now.getTime() + ttl * 1_000).toISOString(),
    attempts: 0,
    consumedAt: null,
  });

  deliver(mobile, code);

  return {
    status: 'sent',
    retryAfterSeconds: 60,
    expiresInSeconds: ttl,
  };
}

/**
 * Hand the code to whatever sends messages.
 *
 * There is no SMS provider configured, and the store this runs against refuses
 * to work outside development, so the transport is the server log. It is
 * marked as such, and it is the only place in the system a code appears in
 * plain form — deliberately on the server, never in a response.
 */
function deliver(mobile: string, code: string): void {
  if (process.env.NODE_ENV === 'production') return;
  // eslint-disable-next-line no-console
  console.info(`[dev sms] verification code for ${mobile}: ${code}`);
}

/* -------------------------------------------------------------------------- */
/* Checking a code                                                            */
/* -------------------------------------------------------------------------- */

export type VerifyOutcome =
  | { readonly status: 'verified'; readonly customer: CustomerRecord }
  /** Wrong code. `remaining` is how many guesses are left on this challenge. */
  | { readonly status: 'wrong'; readonly remaining: number }
  /** No live challenge: it expired, was used, or ran out of attempts. */
  | { readonly status: 'stale' }
  | { readonly status: 'throttled'; readonly retryAfterSeconds: number };

export function verifyCode(mobile: string, code: string, now: Date = new Date()): VerifyOutcome {
  assertAvailable();

  const budget = consume('otp:verify', mobile, now);
  if (!budget.allowed) {
    return { status: 'throttled', retryAfterSeconds: budget.retryAfterSeconds };
  }

  const challenge = findChallenge(mobile);
  if (challenge === undefined || challenge.consumedAt !== null) return { status: 'stale' };

  if (Date.parse(challenge.expiresAt) <= now.getTime()) {
    dropChallenge(mobile);
    return { status: 'stale' };
  }

  challenge.attempts += 1;

  if (!digestsMatch(challenge.codeHash, keyedDigest(`${mobile}:${code}`))) {
    const remaining = MAX_ATTEMPTS - challenge.attempts;
    if (remaining <= 0) {
      dropChallenge(mobile);
      return { status: 'stale' };
    }
    return { status: 'wrong', remaining };
  }

  // One use. Deleting rather than marking leaves nothing to replay.
  dropChallenge(mobile);
  reset('otp:verify', mobile);
  reset('otp:request', mobile);

  const customer = upsertCustomer(mobile, now);
  return { status: 'verified', customer };
}
