'use server';

import { uuidSchema } from '@sharghigold/contracts';
import { redirect } from 'next/navigation';

import { requestCode, setPending } from '@/server/account/otp';
import { endOtherSessions, requireViewer } from '@/server/account/session';
import { findSession, revokeSession } from '@/server/account/store';

/**
 * Begin setting or changing the password.
 *
 * A fresh code is sent to the number on file first, and the customer is taken
 * through the same verification the sign-in uses. That is step-up
 * authentication: a session is enough to browse an account, and not enough to
 * mint a credential that will sign somebody in on its own from now on.
 *
 * The redirect goes to the verify page whether or not a code went out. If the
 * resend window is still open the page counts it down and says so, which is
 * the truth; silently doing nothing would not be.
 */
export async function startPasswordSetup(): Promise<void> {
  const viewer = await requireViewer();

  requestCode(viewer.customer.mobile);
  await setPending({ mobile: viewer.customer.mobile, intent: 'password' });

  redirect('/login/verify');
}

/**
 * Sign one other device out.
 *
 * The id is resolved inside the viewer's own live sessions, so a device id
 * belonging to another account matches nothing and ends nothing.
 */
export async function revokeDevice(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const raw = form.get('deviceId');
  const id = uuidSchema.safeParse(typeof raw === 'string' ? raw : '');

  if (id.success) {
    const session = findSession(viewer.customer.id, id.data);
    // Never this one. Ending the current session from the device list would
    // sign somebody out of the page they are standing on, under a control that
    // says it signs out something else.
    if (session !== undefined && session.id !== viewer.session.id) {
      revokeSession(session, new Date());
    }
  }

  redirect('/account/security?done=device-revoked');
}

/** Sign out everywhere but here. What a customer reaches for after a theft. */
export async function revokeEverywhere(): Promise<void> {
  const viewer = await requireViewer();
  endOtherSessions(viewer);

  redirect('/account/security?done=devices-revoked');
}
