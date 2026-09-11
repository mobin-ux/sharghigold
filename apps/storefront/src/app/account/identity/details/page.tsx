import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { StepShell } from '@/components/account/step-shell';
import { getProfile } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { IdentityForm } from './identity-form';

import '../../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'احراز هویت — اطلاعات هویتی',
  robots: { index: false, follow: false },
};

export default async function IdentityDetailsPage() {
  const viewer = await requireViewer();
  const profile = getProfile(viewer);

  // A submission under review or already accepted is not something to edit.
  // The guard is here rather than only on the link that leads here, because a
  // URL is typed as often as it is clicked.
  if (profile.kyc.status === 'pending' || profile.kyc.status === 'verified') {
    redirect('/account/identity');
  }

  return (
    <StepShell step="identity">
      <IdentityForm
        initial={{
          nationalId: viewer.customer.nationalId ?? '',
          birthDate: viewer.customer.birthDate ?? '',
        }}
      />
    </StepShell>
  );
}
