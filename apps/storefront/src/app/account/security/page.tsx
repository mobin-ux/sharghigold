import type { Metadata } from 'next';

import { ConfirmButton } from '@/components/account/confirm-button';
import { DeviceRow } from '@/components/account/device-row';
import { Flash } from '@/components/account/flash';
import { PageHead } from '@/components/account/page-head';
import { SubmitButton } from '@/components/account/submit-button';
import { getDevices, getProfile } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { revokeEverywhere, startPasswordSetup } from './actions';

import '../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'امنیت و ورود',
  robots: { index: false, follow: false },
};

export default async function SecurityPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const profile = getProfile(viewer);
  const devices = getDevices(viewer);
  const done = (await searchParams)['done'];
  const now = new Date();

  const others = devices.filter((device) => !device.isCurrent).length;

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="امنیت و ورود" back="/account" />

      <main className="zn-security">
        <Flash code={typeof done === 'string' ? done : undefined} />

        <section className="zn-panel zn-panel--bare">
          <div className="zn-passrow">
            <span className="zn-passrow__text">
              <span className="zn-passrow__title">
                {profile.hasPassword ? 'رمز عبور فعال است' : 'رمز عبور تعریف نشده'}
              </span>
              <span className="zn-passrow__note">ورود سریع‌تر بدون انتظار برای پیامک</span>
            </span>
            <form action={startPasswordSetup}>
              <SubmitButton className="zn-passrow__go" pendingLabel="در حال ارسال کد…">
                {profile.hasPassword ? 'تغییر رمز' : 'تعریف رمز'}
              </SubmitButton>
            </form>
          </div>
        </section>

        <section className="zn-panel" aria-labelledby="zn-devices-h">
          <h2 className="zn-panel__title" id="zn-devices-h">
            دستگاه‌های فعال
          </h2>
          <ul className="zn-devices">
            {devices.map((device) => (
              <DeviceRow device={device} key={device.id} now={now} />
            ))}
          </ul>
        </section>

        {others === 0 ? null : (
          <div className="zn-security__all">
            <ConfirmButton
              action={revokeEverywhere}
              className="zn-security__button"
              label="خروج از همه دستگاه‌های دیگر"
              title="خروج از همه دستگاه‌های دیگر؟"
              body="همه دستگاه‌ها به جز همین دستگاه از حساب شما خارج می‌شوند."
              confirm="خروج از همه"
            />
          </div>
        )}

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
