import type { DeviceSession } from '@sharghigold/contracts';

import { revokeDevice } from '@/app/account/security/actions';
import { AppIcon, MobileIcon, MonitorIcon } from '@/components/icons';
import { deviceMeta } from '@/lib/account-view';

import { ConfirmButton } from './confirm-button';

function glyph(kind: DeviceSession['kind']) {
  if (kind === 'app') return <AppIcon size={20} />;
  return kind === 'phone' ? <MobileIcon size={20} /> : <MonitorIcon size={20} />;
}

/**
 * One signed-in device.
 *
 * The current session is marked and has no sign-out control of its own.
 * Ending it here would be the same act as the logout button on the account
 * home, and offering it twice under two names is how somebody signs
 * themselves out by accident.
 */
export function DeviceRow({ device, now }: { readonly device: DeviceSession; readonly now: Date }) {
  return (
    <li className="zn-device">
      <span className="zn-device__icon" aria-hidden="true">
        {glyph(device.kind)}
      </span>
      <span className="zn-device__body">
        <span className="zn-device__line">
          <span className="zn-device__name">{device.name}</span>
          {device.isCurrent ? <span className="zn-device__here">این دستگاه</span> : null}
        </span>
        <span className="zn-device__meta">{deviceMeta(device.place, device.lastSeenAt, now)}</span>
      </span>
      {device.isCurrent ? null : (
        <ConfirmButton
          action={revokeDevice}
          className="zn-device__out"
          label="خروج"
          accessibleLabel={`خروج از ${device.name}`}
          title="خروج از این دستگاه؟"
          body="این دستگاه بلافاصله از حساب شما خارج می‌شود و برای ورود دوباره به کد تأیید نیاز دارد."
          confirm="خروج از دستگاه"
        >
          <input type="hidden" name="deviceId" value={device.id} />
        </ConfirmButton>
      )}
    </li>
  );
}
