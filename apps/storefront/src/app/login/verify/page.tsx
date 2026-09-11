import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/account/auth-shell';
import { getPending } from '@/server/account/otp';
import { peek } from '@/server/account/rate-limit';

import { CodeForm } from '../code-form';

import '../login.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'کد تأیید',
  robots: { index: false, follow: false },
};

export default async function VerifyPage() {
  // Which number is being verified is server state, held in an HttpOnly
  // cookie. Arriving here without one means the flow was skipped, so it starts
  // again rather than offering a box to guess into.
  const pending = await getPending();
  if (pending === undefined) redirect('/login');

  const lead =
    pending.intent === 'password'
      ? 'برای تعریف رمز عبور، ابتدا کد ۵ رقمی پیامک‌شده به شماره زیر را وارد کنید.'
      : 'کد ۵ رقمی به شماره زیر پیامک شد.';

  return (
    <AuthShell title="کد تأیید را وارد کنید" lead={lead} back="/login">
      <CodeForm
        mobile={pending.mobile}
        resendIn={peek('otp:resend', pending.mobile).retryAfterSeconds}
        offerPassword={pending.intent === 'signin'}
      />
    </AuthShell>
  );
}
