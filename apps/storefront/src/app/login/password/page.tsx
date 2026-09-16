import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/account/auth-shell';
import { routes } from '@/lib/routes';
import { getPending } from '@/server/account/otp';

import { PasswordForm } from '../password-form';

import '../login.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ورود با رمز عبور',
  robots: { index: false, follow: false },
};

export default async function PasswordLoginPage() {
  // The number comes from the pending cookie the first step set, so this page
  // is only reachable by walking the flow — not by guessing a URL.
  const pending = await getPending();
  if (pending === undefined) redirect(routes.login());

  return (
    <AuthShell
      title="ورود با رمز عبور"
      lead="رمز عبوری که برای حسابتان تعریف کرده‌اید را وارد کنید."
      back={routes.loginVerify()}
    >
      <PasswordForm mobile={pending.mobile} />
    </AuthShell>
  );
}
