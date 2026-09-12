import type { KycStatus } from '@sharghigold/contracts';
import Link from 'next/link';
import type { ReactElement } from 'react';

import {
  ChevronIcon,
  ClockIcon,
  ShieldAlertIcon,
  ShieldIcon,
  ShieldPlainIcon,
} from '@/components/icons';
import { KYC_COPY } from '@/lib/account-view';
import { routes } from '@/lib/routes';

/** One glyph per state, so the badge is not the only thing that distinguishes them. */
export function kycIcon(status: KycStatus, size: number): ReactElement {
  switch (status) {
    case 'verified':
      return <ShieldIcon size={size} />;
    case 'pending':
      return <ClockIcon size={size} />;
    case 'rejected':
      return <ShieldAlertIcon size={size} />;
    default:
      return <ShieldPlainIcon size={size} />;
  }
}

/**
 * The verification row on the account home.
 *
 * A link, not a button: it goes to a page, and the design's `<button>` costs
 * the middle-click and tells assistive technology the wrong thing about what
 * is about to happen.
 */
export function KycBanner({ status }: { readonly status: KycStatus }) {
  const copy = KYC_COPY[status];

  return (
    <Link className={`zn-kycrow zn-kycrow--${copy.tone}`} href={routes.accountIdentity()}>
      <span className="zn-kycrow__icon" aria-hidden="true">
        {kycIcon(status, 20)}
      </span>
      <span className="zn-kycrow__body">
        <span className="zn-kycrow__line">
          <span className="zn-kycrow__title">احراز هویت</span>
          <span className="zn-kycrow__badge">{copy.badge}</span>
        </span>
        <span className="zn-kycrow__hint">{copy.hint}</span>
      </span>
      <span className="zn-kycrow__go" aria-hidden="true">
        <ChevronIcon size={16} strokeWidth={2} />
      </span>
    </Link>
  );
}
