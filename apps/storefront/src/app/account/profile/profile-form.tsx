'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { CheckIcon } from '@/components/icons';
import { mobileLabel } from '@/lib/account-view';
import { routes } from '@/lib/routes';

import { saveProfile } from './actions';
import type { ProfileDraft, ProfileState } from './state';

interface ProfileFormProps {
  readonly displayName: string | null;
  /** The value while it is still editable, else null. */
  readonly nationalId: string | null;
  /** The last four digits, once identity has been verified. */
  readonly nationalIdMasked: string | null;
  readonly mobile: string;
  readonly hasPassword: boolean;
}

/**
 * Everything the account information screen can change, and what it cannot.
 *
 * Two rows are deliberately not fields.
 *
 * The **mobile number** is the account identity. Changing it changes who the
 * account belongs to, so it goes through a code sent to the new number rather
 * than through a text box — the row shows the verified number and links to
 * that flow.
 *
 * The **password** is managed on the security screen. The design puts the same
 * control on both screens; one control in one place is easier to get right,
 * and setting a password asks for a fresh code, which is a page of its own
 * rather than a button in the middle of a form.
 *
 * A verified national ID is rendered read-only with the reason beside it
 * rather than hidden. Removing the field would leave somebody wondering where
 * the value they entered went.
 */
export function ProfileForm({
  displayName,
  nationalId,
  nationalIdMasked,
  mobile,
  hasPassword,
}: ProfileFormProps) {
  const initial: ProfileDraft = {
    displayName: displayName ?? '',
    nationalId: nationalId ?? '',
  };
  const [state, submit] = useActionState<ProfileState, FormData>(saveProfile, {
    status: 'idle',
    draft: initial,
  });

  const draft = state.status === 'idle' ? initial : state.draft;
  const locked = nationalIdMasked !== null;
  const error = state.status === 'invalid' ? state : undefined;

  return (
    <form action={submit}>
      <div className="zn-profile__fields">
        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-name">
            نام و نام خانوادگی <span className="zn-fld__optional">(اختیاری)</span>
          </label>
          <div className="zn-fld__box">
            <input
              className="zn-fld__input"
              id="zn-name"
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={80}
              placeholder="برای درج روی فاکتور"
              defaultValue={draft.displayName}
              aria-invalid={error?.field === 'displayName'}
            />
          </div>
          {error?.field === 'displayName' ? (
            <p className="zn-fld__help zn-fld__help--bad" role="alert">
              {error.message}
            </p>
          ) : null}
        </div>

        <div className="zn-fld">
          <span className="zn-fld__label" id="zn-mobile-label">
            شماره موبایل
          </span>
          <div className="zn-fld__box zn-fld__box--locked" aria-labelledby="zn-mobile-label">
            <span className="zn-fld__static" dir="ltr">
              {mobileLabel(mobile)}
            </span>
            <span className="zn-fld__ok">
              <CheckIcon size={14} strokeWidth={2.4} />
              تأییدشده
            </span>
          </div>
          {/* The number is what the account signs in with, so changing it is
              an account-takeover path and needs its own verified flow. Until
              that flow exists the link goes somewhere real rather than to a
              page that was never built. */}
          <Link className="zn-fld__link" href={routes.contact()}>
            تغییر شماره موبایل از طریق پشتیبانی
          </Link>
        </div>

        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-nid">
            کد ملی{' '}
            <span className="zn-fld__optional">{locked ? '(تأییدشده)' : '(برای خرید اقساطی)'}</span>
          </label>
          <div
            className={`zn-fld__box${error?.field === 'nationalId' ? ' zn-fld__box--bad' : ''}${
              locked ? ' zn-fld__box--locked' : ''
            }`}
          >
            <input
              className="zn-fld__input zn-fld__input--num"
              id="zn-nid"
              name="nationalId"
              inputMode="numeric"
              dir="ltr"
              maxLength={10}
              placeholder="۱۰ رقم"
              defaultValue={locked ? nationalIdMasked : draft.nationalId}
              readOnly={locked}
              aria-invalid={error?.field === 'nationalId'}
              aria-describedby="zn-nid-help"
            />
          </div>
          <p
            className={`zn-fld__help${error?.field === 'nationalId' ? ' zn-fld__help--bad' : ''}`}
            id="zn-nid-help"
            role={error?.field === 'nationalId' ? 'alert' : undefined}
          >
            {error?.field === 'nationalId'
              ? error.message
              : locked
                ? 'پس از تأیید هویت، کد ملی قابل تغییر نیست.'
                : 'بدون خط تیره وارد کنید.'}
          </p>
        </div>
      </div>

      <section className="zn-panel" aria-labelledby="zn-sec-h">
        <h2 className="zn-panel__title" id="zn-sec-h">
          امنیت
        </h2>
        <div className="zn-passrow">
          <span className="zn-passrow__text">
            <span className="zn-passrow__title">
              {hasPassword ? 'رمز عبور فعال است' : 'رمز عبور تعریف نشده'}
            </span>
            <span className="zn-passrow__note">ورود سریع‌تر بدون انتظار برای پیامک</span>
          </span>
          <Link className="zn-passrow__go" href={routes.accountSecurity()}>
            {hasPassword ? 'تغییر رمز' : 'تعریف رمز'}
          </Link>
        </div>
      </section>

      <div className="zn-profile__save">
        <SubmitButton className="zn-profile__button" pendingLabel="در حال ذخیره…">
          ذخیره تغییرات
        </SubmitButton>
      </div>
    </form>
  );
}
