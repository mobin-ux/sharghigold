import { Alert } from '@sharghigold/ui';
import type { Metadata } from 'next';

import { Flash } from '@/components/account/flash';
import { kycIcon } from '@/components/account/kyc-banner';
import { PageHead } from '@/components/account/page-head';
import { SubmitButton } from '@/components/account/submit-button';
import { CheckIcon } from '@/components/icons';
import {
  KYC_BENEFITS,
  KYC_COPY,
  KYC_STEP_NAME,
  KYC_STEP_NOTE,
  persianCount,
} from '@/lib/account-view';
import { getProfile } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { startVerification } from './actions';

import '../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'احراز هویت',
  robots: { index: false, follow: false },
};

export default async function IdentityPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = getProfile(await requireViewer());
  const { kyc } = profile;
  const copy = KYC_COPY[kyc.status];
  const done = (await searchParams)['done'];

  // Nothing to start while a submission is under review or already accepted.
  const canStart = kyc.status === 'none' || kyc.status === 'rejected';

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="احراز هویت" back="/account" />

      <main className="zn-kyc">
        <Flash code={typeof done === 'string' ? done : undefined} />

        <div className="zn-kyc__hero">
          <span className={`zn-kyc__glyph zn-kyc__glyph--${copy.tone}`} aria-hidden="true">
            {kycIcon(kyc.status, 32)}
          </span>
          <h1 className="zn-kyc__title">{copy.title}</h1>
          <p className="zn-kyc__body">{copy.body}</p>
        </div>

        {kyc.rejectionReason === null ? null : (
          <div className="zn-kyc__alert">
            <Alert variant="danger">{kyc.rejectionReason}</Alert>
          </div>
        )}

        <section className="zn-panel" aria-labelledby="zn-kyc-steps">
          <h2 className="zn-panel__title" id="zn-kyc-steps">
            مراحل احراز هویت
          </h2>
          <ol className="zn-checklist">
            {kyc.steps.map((step, index) => (
              <li className="zn-checklist__row" key={step.key}>
                <span
                  className={`zn-checklist__badge${step.done ? ' zn-checklist__badge--done' : ''}`}
                  aria-hidden="true"
                >
                  {step.done ? <CheckIcon size={13} strokeWidth={3} /> : persianCount(index + 1)}
                </span>
                <span className="zn-checklist__text">
                  <span className="zn-checklist__title">
                    {KYC_STEP_NAME[step.key]}
                    <span className="sr-only">{step.done ? ' — انجام شد' : ' — انجام نشده'}</span>
                  </span>
                  <span className="zn-checklist__note">{KYC_STEP_NOTE[step.key]}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="zn-perks" aria-labelledby="zn-kyc-perks">
          <h2 className="zn-perks__title" id="zn-kyc-perks">
            با احراز هویت چه امکاناتی باز می‌شود؟
          </h2>
          <ul className="zn-perks__list">
            {KYC_BENEFITS.map((benefit) => (
              <li className="zn-perks__item" key={benefit}>
                <CheckIcon size={14} strokeWidth={2.4} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="zn-kyc__privacy">
          اطلاعات هویتی شما رمزنگاری‌شده نگهداری می‌شود و تنها برای تطبیق با سامانه‌های بانکی و صدور
          فاکتور رسمی استفاده می‌گردد.
        </p>

        {canStart ? (
          <form className="zn-kyc__start" action={startVerification}>
            <SubmitButton className="zn-kyc__button" pendingLabel="در حال باز کردن…">
              {kyc.status === 'rejected' ? 'ارسال دوباره مدارک' : 'شروع احراز هویت'}
            </SubmitButton>
          </form>
        ) : null}

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
