import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { StepShell } from '@/components/account/step-shell';
import { getProfile } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { BankForm } from './bank-form';

import '../../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'احراز هویت — حساب بانکی',
  robots: { index: false, follow: false },
};

export default async function IdentityBankPage() {
  const viewer = await requireViewer();
  const profile = getProfile(viewer);

  if (profile.kyc.status === 'pending' || profile.kyc.status === 'verified') {
    redirect('/account/identity');
  }

  // The steps have an order, and it is enforced on the server. Landing on step
  // two without step one is sent back to it rather than shown a form whose
  // submission would be refused.
  if (profile.kyc.steps[0]?.done !== true) redirect('/account/identity/details');

  return (
    <StepShell step="bank">
      <BankForm initial={{ iban: (viewer.customer.iban ?? '').replace(/^IR/, '') }} />
    </StepShell>
  );
}
