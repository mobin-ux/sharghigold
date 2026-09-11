import type { AddressDraft } from '@sharghigold/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAddress,
  getAddresses,
  getOrders,
  getOverview,
  removeAddress,
  chooseDefaultAddress,
  writeAddress,
} from '@/server/account/account';
import {
  digestsMatch,
  hashPassword,
  keyedDigest,
  newNumericCode,
  newToken,
  passwordMatches,
} from '@/server/account/crypto';
import { OTP_DIGITS, requestCode, verifyCode } from '@/server/account/otp';
import { consume, peek, resetAllRateLimits } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  DEMO_MOBILE,
  insertSession,
  newSessionId,
  resetAccountStore,
  upsertCustomer,
  type CustomerRecord,
} from '@/server/account/store';

/**
 * What is pinned here is the part of the account that decides who gets in and
 * what they can reach. Layout can be looked at; these cannot.
 *
 * Every test drives a fixed clock. A code expires in two minutes and a limiter
 * counts in windows, so a test that reads the wall clock is a test that fails
 * when it happens to run near a boundary.
 */
const NOW = new Date('2026-09-11T09:00:00.000Z');
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1_000);

const OTHER_MOBILE = '09121110000';

function viewerFor(customer: CustomerRecord): Viewer {
  const session = insertSession({
    id: newSessionId(),
    customerId: customer.id,
    tokenHash: keyedDigest(newToken()),
    createdAt: NOW.toISOString(),
    lastSeenAt: NOW.toISOString(),
    expiresAt: later(3_600).toISOString(),
    revokedAt: null,
    userAgent: null,
    place: null,
  });
  return { customer, session };
}

/** The code is only ever written to the log, so that is where a test reads it. */
function codeFromLog(spy: ReturnType<typeof vi.spyOn>): string {
  const line = spy.mock.calls.at(-1)?.[0];
  const found = typeof line === 'string' ? /(\d{5})$/.exec(line) : null;
  if (found === null) throw new Error('no code was delivered');
  return found[1] as string;
}

beforeEach(() => {
  resetAccountStore();
  resetAllRateLimits();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/* Hashing and tokens                                                         */
/* -------------------------------------------------------------------------- */

describe('the keyed digest', () => {
  it('is stable for one value and different for another', () => {
    expect(keyedDigest('09120001234:12345')).toBe(keyedDigest('09120001234:12345'));
    expect(keyedDigest('09120001234:12345')).not.toBe(keyedDigest('09120001234:12346'));
  });

  it('does not contain the value it was made from', () => {
    expect(keyedDigest('09120001234:12345')).not.toContain('12345');
  });

  it('compares equal digests and rejects unequal ones of the same length', () => {
    const digest = keyedDigest('a');
    expect(digestsMatch(digest, keyedDigest('a'))).toBe(true);
    expect(digestsMatch(digest, keyedDigest('b'))).toBe(false);
  });
});

describe('a new token', () => {
  it('is long enough not to be guessed and different every time', () => {
    const tokens = new Set(Array.from({ length: 32 }, () => newToken()));
    expect(tokens.size).toBe(32);
    for (const token of tokens) expect(token.length).toBeGreaterThanOrEqual(40);
  });
});

describe('a numeric code', () => {
  it('is exactly the asked-for number of digits, leading zeros kept', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      expect(newNumericCode(OTP_DIGITS)).toMatch(/^\d{5}$/);
    }
  });
});

describe('a password', () => {
  it('verifies against its own record and nothing else', async () => {
    const stored = await hashPassword('a-long-enough-one');
    expect(await passwordMatches('a-long-enough-one', stored)).toBe(true);
    expect(await passwordMatches('a-long-enough-two', stored)).toBe(false);
  });

  it('is stored under a different salt every time', async () => {
    const first = await hashPassword('a-long-enough-one');
    const second = await hashPassword('a-long-enough-one');
    expect(first).not.toBe(second);
    expect(await passwordMatches('a-long-enough-one', second)).toBe(true);
  });

  it('does not keep the password in the record', async () => {
    expect(await hashPassword('correct horse battery')).not.toContain('horse');
  });
});

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

describe('the limiter', () => {
  it('allows a burst up to the rule and refuses the next one', () => {
    // Three code requests in ten minutes is the rule.
    expect(consume('otp:request', DEMO_MOBILE, NOW).allowed).toBe(true);
    expect(consume('otp:request', DEMO_MOBILE, NOW).allowed).toBe(true);
    expect(consume('otp:request', DEMO_MOBILE, NOW).allowed).toBe(true);

    const refused = consume('otp:request', DEMO_MOBILE, NOW);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('counts each subject separately', () => {
    consume('otp:resend', DEMO_MOBILE, NOW);
    expect(consume('otp:resend', DEMO_MOBILE, NOW).allowed).toBe(false);
    expect(consume('otp:resend', OTHER_MOBILE, NOW).allowed).toBe(true);
  });

  it('lets the window pass and starts again', () => {
    consume('otp:resend', DEMO_MOBILE, NOW);
    expect(consume('otp:resend', DEMO_MOBILE, later(30)).allowed).toBe(false);
    expect(consume('otp:resend', DEMO_MOBILE, later(61)).allowed).toBe(true);
  });

  it('reads a verdict without spending an attempt', () => {
    consume('otp:resend', DEMO_MOBILE, NOW);
    expect(peek('otp:resend', DEMO_MOBILE, later(10)).allowed).toBe(false);
    expect(peek('otp:resend', DEMO_MOBILE, later(61)).allowed).toBe(true);
    // Still the first of the window, because peeking spent nothing.
    expect(consume('otp:resend', DEMO_MOBILE, later(61)).allowed).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* The code                                                                   */
/* -------------------------------------------------------------------------- */

describe('signing in with a code', () => {
  it('answers the same for a number with an account and one without', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const known = requestCode(DEMO_MOBILE, NOW);
    const unknown = requestCode(OTHER_MOBILE, NOW);
    expect(known.status).toBe('sent');
    expect(unknown).toEqual(known);
  });

  it('refuses a second code inside the resend window', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    requestCode(DEMO_MOBILE, NOW);
    expect(requestCode(DEMO_MOBILE, later(30)).status).toBe('throttled');
    expect(requestCode(DEMO_MOBILE, later(61)).status).toBe('sent');
  });

  it('signs in when the code is right', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    requestCode(DEMO_MOBILE, NOW);

    const outcome = verifyCode(DEMO_MOBILE, codeFromLog(spy), later(5));
    expect(outcome.status).toBe('verified');
    if (outcome.status === 'verified') expect(outcome.customer.mobile).toBe(DEMO_MOBILE);
  });

  it('will not take the same code twice', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    requestCode(DEMO_MOBILE, NOW);
    const code = codeFromLog(spy);

    expect(verifyCode(DEMO_MOBILE, code, later(5)).status).toBe('verified');
    expect(verifyCode(DEMO_MOBILE, code, later(6)).status).toBe('stale');
  });

  it('counts wrong guesses down and then stops answering', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    requestCode(DEMO_MOBILE, NOW);
    const code = codeFromLog(spy);
    const wrong = code === '00000' ? '11111' : '00000';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const outcome = verifyCode(DEMO_MOBILE, wrong, later(attempt));
      expect(outcome.status).toBe('wrong');
      if (outcome.status === 'wrong') expect(outcome.remaining).toBe(5 - attempt);
    }

    expect(verifyCode(DEMO_MOBILE, wrong, later(5)).status).toBe('stale');
    // The right code no longer works either: the challenge is gone.
    expect(verifyCode(DEMO_MOBILE, code, later(6)).status).toBe('stale');
  });

  it('stops accepting a code once it has expired', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const sent = requestCode(DEMO_MOBILE, NOW);
    const code = codeFromLog(spy);
    if (sent.status !== 'sent') throw new Error('expected a code');

    expect(verifyCode(DEMO_MOBILE, code, later(sent.expiresInSeconds + 1)).status).toBe('stale');
  });

  it('gives nothing away when a code is asked about for a number that never had one', () => {
    expect(verifyCode(OTHER_MOBILE, '12345', NOW).status).toBe('stale');
  });
});

/* -------------------------------------------------------------------------- */
/* One customer cannot reach another's rows                                   */
/* -------------------------------------------------------------------------- */

const DRAFT: AddressDraft = {
  deliverToSelf: true,
  label: 'home',
  province: 'تهران',
  city: 'تهران',
  line: 'خیابان ولیعصر، کوچه ۹',
  plate: '12',
  unit: null,
  postalCode: '1194733109',
  isDefault: true,
};

describe('scoping', () => {
  function twoCustomers() {
    const mine = viewerFor(upsertCustomer(DEMO_MOBILE, NOW));
    const theirs = viewerFor(upsertCustomer(OTHER_MOBILE, NOW));
    return { mine, theirs };
  }

  it('lists only the viewer’s own addresses', () => {
    const { mine, theirs } = twoCustomers();
    const written = writeAddress(theirs, DRAFT);
    expect(written.status).toBe('saved');

    expect(getAddresses(theirs)).toHaveLength(1);
    expect(getAddresses(mine).some((address) => address.line === DRAFT.line)).toBe(false);
  });

  it('answers «not found» for somebody else’s address, not «forbidden»', () => {
    const { mine, theirs } = twoCustomers();
    const written = writeAddress(theirs, DRAFT);
    if (written.status !== 'saved') throw new Error('expected a saved address');

    expect(getAddress(mine, written.id)).toBeUndefined();
    expect(writeAddress(mine, DRAFT, written.id).status).toBe('not-found');
    expect(removeAddress(mine, written.id)).toBe(false);
    expect(chooseDefaultAddress(mine, written.id)).toBe(false);

    // And it is still there afterwards.
    expect(getAddresses(theirs)).toHaveLength(1);
  });

  it('refuses a city that does not belong to the province', () => {
    const { mine } = twoCustomers();
    expect(writeAddress(mine, { ...DRAFT, city: 'شیراز' }).status).toBe('unknown-region');
  });

  it('makes the first address the default whatever the switch says', () => {
    // The second customer starts with no addresses; the demo one is seeded.
    const { theirs } = twoCustomers();
    const written = writeAddress(theirs, { ...DRAFT, isDefault: false });
    if (written.status !== 'saved') throw new Error('expected a saved address');
    expect(getAddress(theirs, written.id)?.isDefault).toBe(true);
  });

  it('takes the recipient from the profile rather than the form', () => {
    const { mine } = twoCustomers();
    const written = writeAddress(mine, DRAFT);
    if (written.status !== 'saved') throw new Error('expected a saved address');
    expect(getAddress(mine, written.id)?.recipientMobile).toBe(DEMO_MOBILE);
  });

  it('lists only the viewer’s own orders', () => {
    const { mine, theirs } = twoCustomers();
    // The demo customer is seeded with orders; a second customer has none.
    expect(getOrders(mine, 'all').total).toBeGreaterThan(0);
    expect(getOrders(theirs, 'all').total).toBe(0);
  });

  it('never returns a verified identifier to the page', () => {
    const { mine } = twoCustomers();
    expect(getOverview(mine).profile).not.toHaveProperty('nationalId', expect.any(String));
  });
});
