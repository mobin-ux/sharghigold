'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { mobileLabel } from '@/lib/account-view';

import { submitPassword } from './actions';
import { EMPTY_PASSWORD, type PasswordState } from './state';

/**
 * Sign in with the password the account already has.
 *
 * The field is never repopulated after a failure. Putting a password back into
 * the DOM leaves it in the page source, in the browser's form cache and in any
 * screenshot of the error — and retyping eight characters is not the cost that
 * matters here.
 *
 * The visibility toggle is `type="button"`, so pressing Enter in the field
 * still submits the form rather than revealing the password.
 */
export function PasswordForm({ mobile }: { readonly mobile: string }) {
  const [state, submit] = useActionState<PasswordState, FormData>(submitPassword, EMPTY_PASSWORD);
  const [shown, setShown] = useState(false);

  const message = state.status === 'error' ? state.message : undefined;

  return (
    <>
      <p className="zn-auth__who zn-auth__who--tight">
        <span className="zn-auth__number" dir="ltr">
          {mobileLabel(mobile)}
        </span>
        <Link className="zn-auth__change" href="/login">
          ویرایش شماره
        </Link>
      </p>

      <form className="zn-auth__form" action={submit}>
        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-pw">
            رمز عبور
          </label>
          <div className={`zn-fld__box${message === undefined ? '' : ' zn-fld__box--bad'}`}>
            <input
              className="zn-fld__input"
              id="zn-pw"
              name="password"
              type={shown ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={message !== undefined}
              aria-describedby={message === undefined ? undefined : 'zn-pw-error'}
              required
            />
            <button
              className="zn-fld__peek"
              type="button"
              aria-pressed={shown}
              aria-label={shown ? 'پنهان کردن رمز' : 'نمایش رمز'}
              onClick={() => setShown((previous) => !previous)}
            >
              {shown ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
          {message === undefined ? null : (
            <p className="zn-fld__help zn-fld__help--bad" id="zn-pw-error" role="alert">
              {message}
            </p>
          )}
        </div>

        <Link className="zn-auth__forgot" href="/login?intent=password">
          رمز عبور را فراموش کرده‌ام
        </Link>

        <div className="zn-auth__foot">
          <SubmitButton className="zn-auth__go" pendingLabel="در حال ورود…">
            ورود
          </SubmitButton>
        </div>
      </form>
    </>
  );
}
