import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { StepShell } from '@/components/account/step-shell';
import { getProfile, selfieChallengeFor } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { SelfieForm } from './selfie-form';

import '../../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'احراز هویت — تصویر چهره',
  robots: { index: false, follow: false },
};

export default async function IdentitySelfiePage() {
  const viewer = await requireViewer();
  const profile = getProfile(viewer);

  if (profile.kyc.status === 'pending' || profile.kyc.status === 'verified') {
    redirect('/account/identity');
  }
  if (profile.kyc.steps[0]?.done !== true) redirect('/account/identity/details');
  if (profile.kyc.steps[1]?.done !== true) redirect('/account/identity/bank');

  // Issued by the server when the step is opened, and held against the
  // account. The design hardcodes one number for everybody, which makes the
  // photograph reusable — and a liveness check that can be satisfied once and
  // replayed forever is not one.
  const challenge = selfieChallengeFor(viewer);

  return (
    <StepShell step="selfie">
      <SelfieForm challenge={challenge} />
    </StepShell>
  );
}
