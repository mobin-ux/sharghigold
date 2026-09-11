/**
 * Who is making this request.
 *
 * Server-only. Every page and action that touches account data starts here,
 * and the property that matters is that identity comes from a cookie the
 * browser cannot read or forge — never from a parameter, a header the client
 * chose, or a hidden field in a form.
 *
 * The cookie carries a 256-bit random token and nothing else. It is not a JWT:
 * there is no claim inside it to trust, no algorithm to confuse, and nothing
 * to revoke by waiting for an expiry. Only the token's keyed hash is stored,
 * so a dump of the session table hands over no live sessions.
 *
 * Cookie attributes, and why each one:
 *
 * - `httpOnly` — script cannot read it, so an injected payload has nothing to
 *   send anywhere.
 * - `secure` outside development — it never travels in the clear.
 * - `sameSite: 'lax'` — a cross-site POST does not carry it, which is CSRF
 *   defence at the transport rather than a token the app has to remember to
 *   check. Lax rather than Strict so that arriving from a payment gateway or
 *   an SMS link does not land on a signed-out page.
 * - `path: '/'` — one session for the whole site.
 */
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { digestsMatch, keyedDigest, newToken } from './crypto';
import {
  findCustomer,
  findSessionByTokenHash,
  insertSession,
  newSessionId,
  revokeOtherSessions,
  revokeSession,
  type CustomerRecord,
  type SessionRecord,
} from './store';

export const SESSION_COOKIE = 'zn_session';

/** Thirty days, matching `SESSION_TTL_SECONDS` in the environment contract. */
const DEFAULT_TTL_SECONDS = 2_592_000;

function ttlSeconds(): number {
  const configured = Number(process.env['SESSION_TTL_SECONDS']);
  return Number.isInteger(configured) && configured >= 60 ? configured : DEFAULT_TTL_SECONDS;
}

export interface Viewer {
  readonly customer: CustomerRecord;
  readonly session: SessionRecord;
}

/**
 * The signed-in customer, or undefined.
 *
 * Expiry and revocation are checked here rather than left to the cookie's own
 * lifetime: a cookie's `maxAge` is a request the browser may ignore, and a
 * session the shop has ended must stop working the moment it does.
 */
export async function getViewer(): Promise<Viewer | undefined> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token === undefined || token === '') return undefined;

  const session = findSessionByTokenHash(keyedDigest(token));
  if (session === undefined) return undefined;

  // Compare again in constant time. The map lookup above already matched, so
  // this costs one hash — and it means the lookup is never the only check.
  if (!digestsMatch(session.tokenHash, keyedDigest(token))) return undefined;
  if (session.revokedAt !== null) return undefined;
  if (Date.parse(session.expiresAt) <= Date.now()) return undefined;

  const customer = findCustomer(session.customerId);
  if (customer === undefined) return undefined;

  session.lastSeenAt = new Date().toISOString();

  return { customer, session };
}

/**
 * The signed-in customer, or a redirect to sign in.
 *
 * `redirect` throws, so nothing after a call to this runs unauthenticated —
 * which is the reason authorization is a call at the top of a page rather than
 * a boolean somewhere in its markup.
 */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer === undefined) redirect('/login');
  return viewer;
}

/* -------------------------------------------------------------------------- */
/* Starting and ending a session                                              */
/* -------------------------------------------------------------------------- */

/**
 * Sign a customer in.
 *
 * Called only from a Server Action, because only an action may write a cookie.
 * A new token is minted every time: nothing is ever reused across a sign-in,
 * so a token captured before one cannot be replayed after it.
 */
export async function startSession(customer: CustomerRecord, now = new Date()): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(now.getTime() + ttlSeconds() * 1_000);
  const userAgent = (await headers()).get('user-agent');

  insertSession({
    id: newSessionId(),
    customerId: customer.id,
    tokenHash: keyedDigest(token),
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    userAgent,
    // No geolocation service is wired up, and an IP address is not a place.
    // The device list says when rather than where until one is.
    place: null,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttlSeconds(),
  });
}

/** Sign out of this device. */
export async function endSession(now = new Date()): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token !== undefined && token !== '') {
    const session = findSessionByTokenHash(keyedDigest(token));
    if (session !== undefined) revokeSession(session, now);
  }

  jar.delete(SESSION_COOKIE);
}

/** Sign out of every other device. Returns how many were ended. */
export function endOtherSessions(viewer: Viewer, now = new Date()): number {
  return revokeOtherSessions(viewer.customer.id, viewer.session.tokenHash, now);
}
