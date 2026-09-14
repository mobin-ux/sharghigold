'use client';

import { useActionState } from 'react';

import { subscribeToUpdates, type SubscribeState } from '@/app/actions';
import { CheckIcon } from '@/components/icons';

const INITIAL: SubscribeState = { status: 'idle' };

/**
 * The magazine's SMS sign-up.
 *
 * The same Server Action and list as the homepage form: the number is parsed
 * by the shared contract, rate-limited, and a repeat sign-up answers like a
 * first. The canvas offers «خبرنامه» or «خبرنامه + هشدار قیمت»; price alerts
 * do not exist, so there is one list and no choice to make.
 *
 * On success the form is replaced by the confirmation, as the canvas draws it,
 * inside a live region so the swap is announced.
 */
export function NewsletterCard() {
  const [state, submit, pending] = useActionState(subscribeToUpdates, INITIAL);

  return (
    <section
      className="zn-magsec zn-magsec--anchor"
      id="newsletter"
      aria-labelledby="newsletter-title"
    >
      <div className="zn-magnews" aria-live="polite">
        {state.status === 'done' ? (
          <div className="zn-magnews__done">
            <span className="zn-magnews__tick" aria-hidden="true">
              <CheckIcon size={19} strokeWidth={2.2} />
            </span>
            <span>
              <span className="zn-magnews__donetitle" id="newsletter-title">
                عضویت شما ثبت شد
              </span>
              <span className="zn-magnews__donebody">هر هفته یک پیامک برایتان می‌فرستیم.</span>
            </span>
          </div>
        ) : (
          <>
            <h2 className="zn-magnews__title" id="newsletter-title">
              خبرنامه پیامکی زرنما
            </h2>
            <p className="zn-magnews__body">
              شماره موبایل خود را وارد کنید تا هر هفته یک پیامک از تازه‌های زرنما و تخفیف اجرت
              دریافت کنید.
            </p>
            <form className="zn-magnews__form" action={submit}>
              <label className="sr-only" htmlFor="magazine-phone">
                شماره موبایل
              </label>
              <input
                className="zn-magnews__input"
                id="magazine-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={20}
                required
                placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                aria-invalid={state.status === 'error' || undefined}
                aria-describedby={state.status === 'error' ? 'magazine-phone-error' : undefined}
              />
              {state.status === 'error' ? (
                <span className="zn-magnews__error" id="magazine-phone-error">
                  {state.message}
                </span>
              ) : null}
              <button
                className="zn-magbtn zn-magbtn--gold zn-magnews__submit"
                type="submit"
                disabled={pending}
              >
                عضویت رایگان
              </button>
            </form>
            <p className="zn-magnews__note">
              با ثبت شماره، دریافت پیامک‌های خبری و تبلیغاتی زرنما را می‌پذیرید.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
