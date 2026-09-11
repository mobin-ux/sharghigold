'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';

import { OtpInput } from '@/components/account/otp-input';
import { SubmitButton } from '@/components/account/submit-button';
import { mobileLabel, persianCount } from '@/lib/account-view';

import { resendSignInCode, submitSignInCode } from './actions';
import { EMPTY_CODE, type CodeState } from './state';

interface CodeFormProps {
  readonly mobile: string;
  /** Seconds until another code may be asked for, as the server counted them. */
  readonly resendIn: number;
  readonly offerPassword: boolean;
}

const FORM_ID = 'zn-code-form';

/**
 * The five boxes, the timer, and the button that verifies.
 *
 * `resendIn` arrives from the server rather than being started in the browser,
 * for the same reason the price lock does on the product page: the first
 * client render has to produce exactly the string the server sent, or the
 * number flickers on arrival. Counting down to a deadline rather than
 * decrementing also means a tab left in the background for a minute comes back
 * showing the truth.
 *
 * Two forms, because verifying and resending are different acts with different
 * consequences and one form cannot have two actions. The primary button sits
 * outside the form it submits, tied to it by `form` — which is what keeps the
 * timer between the boxes and the button, where the design puts it.
 */
export function CodeForm({ mobile, resendIn, offerPassword }: CodeFormProps) {
  const [state, submit, pending] = useActionState<CodeState, FormData>(
    submitSignInCode,
    EMPTY_CODE,
  );
  const [left, setLeft] = useState(resendIn);
  const [counted, setCounted] = useState(resendIn);

  // A new figure from the server restarts the count. Adjusted here rather than
  // in an effect: an effect would paint the stale number first, and the one
  // thing this component must not do is show a second that has already passed.
  if (counted !== resendIn) {
    setCounted(resendIn);
    setLeft(resendIn);
  }

  useEffect(() => {
    if (resendIn <= 0) return;

    const deadline = Date.now() + resendIn * 1_000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1_000));
      setLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1_000);

    return () => clearInterval(timer);
  }, [resendIn]);

  const message = state.status === 'error' ? state.message : undefined;

  return (
    <>
      <p className="zn-auth__who">
        <span className="zn-auth__number" dir="ltr">
          {mobileLabel(mobile)}
        </span>
        <Link className="zn-auth__change" href="/login">
          ویرایش شماره
        </Link>
      </p>

      <form className="zn-auth__code" id={FORM_ID} action={submit}>
        <OtpInput name="code" error={message !== undefined} describedBy="zn-code-help" />
      </form>

      <p
        className={`zn-auth__codemsg${message === undefined ? '' : ' zn-auth__codemsg--bad'}`}
        id="zn-code-help"
        role="status"
      >
        {message ?? ''}
      </p>

      <form className="zn-auth__resend" action={resendSignInCode}>
        {left > 0 ? (
          <span className="zn-auth__timer">
            ارسال دوباره کد تا <span className="zn-auth__seconds">{persianCount(left)}</span> ثانیه
          </span>
        ) : (
          <SubmitButton className="zn-auth__again" pendingLabel="در حال ارسال…">
            ارسال دوباره کد
          </SubmitButton>
        )}
      </form>

      <div className="zn-auth__foot">
        <button className="zn-auth__go" type="submit" form={FORM_ID} disabled={pending}>
          {pending ? 'در حال بررسی…' : 'تأیید و ورود'}
        </button>

        {offerPassword ? (
          <Link className="zn-auth__alt" href="/login/password">
            ورود با رمز عبور
          </Link>
        ) : null}
      </div>
    </>
  );
}
