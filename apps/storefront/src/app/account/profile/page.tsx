import type { Metadata } from 'next';

import { PageHead } from '@/components/account/page-head';
import { getProfile } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { ProfileForm } from './profile-form';

import '../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'اطلاعات حساب',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const profile = getProfile(await requireViewer());

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="اطلاعات حساب" back="/account" />

      <main className="zn-profile">
        <p className="zn-profile__note">
          این اطلاعات اختیاری است و فقط برای صدور فاکتور و تحویل سفارش استفاده می‌شود.
        </p>

        <ProfileForm
          displayName={profile.displayName}
          nationalId={profile.nationalId}
          nationalIdMasked={profile.nationalIdMasked}
          mobile={profile.mobile}
          hasPassword={profile.hasPassword}
        />

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
