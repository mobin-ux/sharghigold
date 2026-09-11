import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/account/auth-shell';
import { getViewer } from '@/server/account/session';

import { NewPasswordForm } from '../../new-password-form';

import '../../login.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'رمز عبور جدید',
  robots: { index: false, follow: false },
};

export default async function NewPasswordPage() {
  // Setting a password requires being signed in, and the only way here is
  // through a code sent to the number on file. That is what makes «I forgot
  // my password» safe: the reset is authenticated by the same thing the
  // account is.
  if ((await getViewer()) === undefined) redirect('/login?intent=password');

  return (
    <AuthShell
      title="رمز عبور جدید"
      lead="رمزی انتخاب کنید که فقط خودتان بدانید."
      back="/account/security"
    >
      <NewPasswordForm />
    </AuthShell>
  );
}
