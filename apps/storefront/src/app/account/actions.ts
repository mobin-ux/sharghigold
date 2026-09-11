'use server';

import { redirect } from 'next/navigation';

import { endSession } from '@/server/account/session';

/**
 * Sign out of this device.
 *
 * A Server Action rather than a link, because signing out changes state and a
 * GET that changes state is a request a prefetch, a crawler or an image tag
 * can make on the customer's behalf. Server Actions are POSTs with an origin
 * check, and the session cookie is `SameSite=Lax`, so a form on another site
 * cannot reach this.
 *
 * The session is revoked server-side as well as forgotten by the browser. A
 * cookie that is merely deleted is a token still valid to anyone who copied
 * it.
 */
export async function signOut(): Promise<void> {
  await endSession();
  redirect('/login');
}
