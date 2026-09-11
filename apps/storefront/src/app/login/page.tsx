import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/account/auth-shell';
import { getViewer } from '@/server/account/session';

import { MobileForm } from './mobile-form';

import './login.css';

/**
 * Never prerendered: what this page should do depends on whether the person
 * asking for it already has a session.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ورود یا ثبت‌نام',
  robots: { index: false, follow: false },
};

const COPY = {
  signin: {
    title: 'ورود یا ثبت‌نام',
    lead: 'فقط با شماره موبایل. نیازی به نام، ایمیل یا رمز عبور نیست.',
  },
  password: {
    title: 'بازیابی رمز عبور',
    lead: 'شماره موبایل حسابتان را وارد کنید تا کد تأیید برایتان بفرستیم.',
  },
} as const;

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Already signed in: there is nothing to do here, and leaving the form up
  // invites somebody to sign in as themselves twice.
  if ((await getViewer()) !== undefined) redirect('/account');

  // Anything but the one value we know is a plain sign-in. The parameter picks
  // between two fixed pieces of copy and nothing else.
  const intent = (await searchParams)['intent'] === 'password' ? 'password' : 'signin';
  const copy = COPY[intent];

  return (
    <AuthShell title={copy.title} lead={copy.lead} back="/">
      <MobileForm intent={intent} />
    </AuthShell>
  );
}
