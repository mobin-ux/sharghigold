/**
 * A fixed-window rate limiter for the endpoints worth attacking.
 *
 * Sign-in is the one place in a shop where an unauthenticated stranger may
 * make the server do expensive work, send a paid SMS, and guess at a secret —
 * all in the same request. Without a limit, an account with a five-digit code
 * falls in minutes and the shop pays for the messages (rule 13).
 *
 * Windows are fixed rather than sliding. A sliding window is more accurate at
 * the boundary; a fixed one is a counter and a timestamp, which is what this
 * needs to be while it lives in process memory. When Redis is behind it the
 * shape does not change — only where `hits` is kept.
 *
 * Two things it deliberately does not do. It does not throw: a caller gets a
 * decision and chooses what to say, because «too many attempts» is a message
 * for the customer and not an exception for a log. And it never keys on
 * anything a request can choose freely — a key is a fixed action name plus a
 * mobile number or an address, so nobody widens their own budget by varying a
 * header.
 */

export interface RateLimitRule {
  /** How many attempts the window allows. */
  readonly limit: number;
  readonly windowSeconds: number;
}

export interface RateLimitVerdict {
  readonly allowed: boolean;
  /** Attempts left after this one. Zero once the window is spent. */
  readonly remaining: number;
  /** Seconds until the window resets. Drives «try again in …». */
  readonly retryAfterSeconds: number;
}

/**
 * The rules, named by what they protect rather than by their numbers.
 *
 * Requesting a code is limited harder than verifying one: each request sends a
 * message the shop pays for, while a verification is only cheap arithmetic
 * behind an attempt counter that already burns the challenge.
 */
export const RATE_LIMITS = {
  /** The gap between one code and the next, which the page counts down. */
  'otp:resend': { limit: 1, windowSeconds: 60 },
  'otp:request': { limit: 3, windowSeconds: 600 },
  'otp:verify': { limit: 10, windowSeconds: 600 },
  'password:login': { limit: 8, windowSeconds: 900 },
  'address:write': { limit: 30, windowSeconds: 3_600 },
  'kyc:submit': { limit: 10, windowSeconds: 3_600 },
  /* Starting a payment costs the provider a request and leaves a row behind,
     so the budget is small enough that a loop is noticed and large enough that
     somebody retrying a failed card is not locked out. */
  'wallet:topup': { limit: 12, windowSeconds: 3_600 },
  /* Placing an order reserves stock and asks a provider for money. The budget
     is small because a loop here empties the shelves as effectively as it
     empties a card. */
  'checkout:place': { limit: 10, windowSeconds: 3_600 },
  /* Guessing at discount codes is cheap for the attacker and free money if it
     lands, so the list is only worth trying at this rate. */
  'cart:code': { limit: 15, windowSeconds: 900 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface Window {
  hits: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/**
 * Drop windows that have expired.
 *
 * Called on each check rather than on a timer: an interval in a module keeps a
 * process alive and is one more thing to shut down. The map only grows while
 * traffic does, and this is what stops it growing forever.
 */
function sweep(now: number): void {
  if (windows.size < 512) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/**
 * Count one attempt against `action` for `subject` and say whether it stands.
 *
 * `subject` is the thing being protected — a mobile number, an account id, a
 * client address. It is never echoed back to anyone.
 */
export function consume(
  action: RateLimitAction,
  subject: string,
  now: Date = new Date(),
): RateLimitVerdict {
  const rule = RATE_LIMITS[action];
  const stamp = now.getTime();
  const key = `${action}:${subject}`;

  sweep(stamp);

  const existing = windows.get(key);
  const window =
    existing === undefined || existing.resetAt <= stamp
      ? { hits: 0, resetAt: stamp + rule.windowSeconds * 1_000 }
      : existing;

  window.hits += 1;
  windows.set(key, window);

  const retryAfterSeconds = Math.max(0, Math.ceil((window.resetAt - stamp) / 1_000));

  return {
    allowed: window.hits <= rule.limit,
    remaining: Math.max(0, rule.limit - window.hits),
    retryAfterSeconds,
  };
}

/**
 * Forget a subject's attempts.
 *
 * Called after a successful sign-in, so that one person mistyping their
 * password twice and then getting it right does not leave them near a limit
 * for the next quarter of an hour.
 */
export function reset(action: RateLimitAction, subject: string): void {
  windows.delete(`${action}:${subject}`);
}

/** Empty every window. Exists for tests, which must not share state. */
export function resetAllRateLimits(): void {
  windows.clear();
}

/**
 * How a subject stands against a rule, without counting an attempt.
 *
 * The verify page needs this: it draws a countdown to the moment another code
 * may be asked for, and reading that must not itself consume the budget.
 */
export function peek(
  action: RateLimitAction,
  subject: string,
  now: Date = new Date(),
): RateLimitVerdict {
  const rule = RATE_LIMITS[action];
  const window = windows.get(`${action}:${subject}`);
  const stamp = now.getTime();

  if (window === undefined || window.resetAt <= stamp) {
    return { allowed: true, remaining: rule.limit, retryAfterSeconds: 0 };
  }

  return {
    allowed: window.hits < rule.limit,
    remaining: Math.max(0, rule.limit - window.hits),
    retryAfterSeconds: Math.max(0, Math.ceil((window.resetAt - stamp) / 1_000)),
  };
}
