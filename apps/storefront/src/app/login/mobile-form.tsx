'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { SubmitButton } from '@/components/account/submit-button';
import { MobileIcon } from '@/components/icons';
import { routes } from '@/lib/routes';

import { requestSignInCode } from './actions';
import { EMPTY_MOBILE, type MobileState } from './state';

interface MobileFormProps {
  /** `password` when the customer is on the «I forgot mine» path. */
  readonly intent: 'signin' | 'password';
}

/**
 * The number, and the button that asks for a code.
 *
 * `type="tel"` with `inputMode="numeric"` and `autoComplete="tel"` gives a
 * phone its keyboard and its autofill. `dir="ltr"` on the field is not
 * decoration: a number left to the page's RTL direction has its leading zero
 * rendered at the wrong end, and the customer reads back something they did
 * not type.
 *
 * The field is not disabled while empty and the button is not either. The
 * design greys the button out until the number is valid, which leaves somebody
 * who mistyped with a control that does nothing and no explanation; pressing
 * it and being told what is wrong is the more useful of the two.
 *
 * There is no «sign in with a password instead» here, although the design puts
 * one on this step when the account has one. Knowing whether it does would
 * mean looking the number up before a code has been verified, and a form that
 * changes shape depending on whether a number is registered answers that
 * question for anybody with a list of numbers.
 */
export function MobileForm({ intent }: MobileFormProps) {
  const [state, submit] = useActionState<MobileState, FormData>(requestSignInCode, EMPTY_MOBILE);

  const bad = state.status === 'invalid' || state.status === 'throttled';
  const message =
    state.status === 'invalid' || state.status === 'throttled' ? state.message : undefined;

  return (
    <form className="zn-auth__form" action={submit}>
      <input type="hidden" name="intent" value={intent} />

      <div className="zn-fld">
        <label className="zn-fld__label" htmlFor="zn-mobile">
          شماره موبایل
        </label>
        <div className={`zn-fld__box zn-fld__box--tel${bad ? ' zn-fld__box--bad' : ''}`}>
          <span className="zn-fld__icon" aria-hidden="true">
            <MobileIcon size={19} />
          </span>
          <input
            className="zn-fld__input zn-fld__input--tel"
            id="zn-mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            maxLength={16}
            placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
            defaultValue={state.mobile}
            aria-invalid={bad}
            aria-describedby="zn-mobile-help"
            required
          />
        </div>
        <p className={`zn-fld__help${bad ? ' zn-fld__help--bad' : ''}`} id="zn-mobile-help">
          {message ??
            'اگر قبلاً ثبت‌نام کرده باشید وارد می‌شوید، در غیر این صورت حساب شما ساخته می‌شود.'}
        </p>
      </div>

      {state.status === 'unavailable' ? (
        <p className="zn-auth__closed" role="alert">
          ورود به حساب در این نسخه فعال نیست. تا زمانی که سرویس حساب کاربری راه‌اندازی شود، خرید
          بدون حساب انجام می‌شود.
        </p>
      ) : null}

      <div className="zn-auth__foot">
        <SubmitButton className="zn-auth__go" pendingLabel="در حال ارسال کد…">
          ادامه
        </SubmitButton>

        <p className="zn-auth__terms">
          با ادامه، <Link href={routes.terms()}>قوانین</Link> و{' '}
          <Link href={routes.privacy()}>حریم خصوصی</Link> زرنما را می‌پذیرید.
        </p>
      </div>
    </form>
  );
}
