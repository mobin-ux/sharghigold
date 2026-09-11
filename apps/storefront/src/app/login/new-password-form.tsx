'use client';

import { PASSWORD_MIN } from '@sharghigold/contracts';
import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { persianCount } from '@/lib/account-view';

import { submitNewPassword } from './actions';
import { EMPTY_PASSWORD, type PasswordState } from './state';

/**
 * Choose a password for an account that is already signed in.
 *
 * `autoComplete="new-password"` on both fields is what tells a password
 * manager to offer to generate one rather than to fill the old one in — the
 * single most effective thing a form can do about password quality.
 *
 * The confirmation is checked again on the server. This copy of the rule is
 * there so the customer finds out before submitting, not so the server can
 * skip it.
 */
export function NewPasswordForm() {
  const [state, submit] = useActionState<PasswordState, FormData>(
    submitNewPassword,
    EMPTY_PASSWORD,
  );
  const [shown, setShown] = useState(false);

  const message = state.status === 'error' ? state.message : undefined;

  return (
    <form className="zn-auth__form" action={submit}>
      <div className="zn-auth__pair">
        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-p1">
            رمز جدید
          </label>
          <div className="zn-fld__box">
            <input
              className="zn-fld__input"
              id="zn-p1"
              name="password"
              type={shown ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              placeholder={`حداقل ${persianCount(PASSWORD_MIN)} کاراکتر`}
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
        </div>

        <div className="zn-fld">
          <label className="zn-fld__label" htmlFor="zn-p2">
            تکرار رمز جدید
          </label>
          <div className={`zn-fld__box${message === undefined ? '' : ' zn-fld__box--bad'}`}>
            <input
              className="zn-fld__input"
              id="zn-p2"
              name="confirmation"
              type={shown ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              aria-invalid={message !== undefined}
              aria-describedby={message === undefined ? undefined : 'zn-p2-error'}
              required
            />
          </div>
          {message === undefined ? null : (
            <p className="zn-fld__help zn-fld__help--bad" id="zn-p2-error" role="alert">
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="zn-auth__foot">
        <SubmitButton className="zn-auth__go" pendingLabel="در حال ثبت…">
          ثبت رمز جدید
        </SubmitButton>
      </div>
    </form>
  );
}
